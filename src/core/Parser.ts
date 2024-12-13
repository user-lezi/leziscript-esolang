import { inspect } from "util";
import { IToken, Tokenizer, TokenType } from "./Tokenizer";
import { boldText, redText, sliceText } from "../util";
import { extname, join } from "path";
import { accessSync, existsSync } from "fs";

const ParserError = {
  Unknown: (tokenizer: Tokenizer) => {
    let token = tokenizer.token()!;
    let line = tokenizer.locate();
    let slices = sliceText(
      line.line,
      token.index - line.fromIndex,
      token.index + token.token.length - line.fromIndex,
    );
    return new SyntaxError(
      `Unable to parse code: Found Unknown Token Type.\n` +
        slices[0] +
        boldText(redText(slices[1])) +
        slices[2] +
        "\n" +
        " ".repeat(token.index - line.fromIndex) +
        "^",
    );
  },
  InvalidFile: (tokenizer: Tokenizer) => {
    let token = tokenizer.token()!;
    let line = tokenizer.locate();
    let slices = sliceText(
      line.line,
      token.index - line.fromIndex,
      token.index + token.token.length - line.fromIndex,
    );
    return new SyntaxError(
      `Unable to parse code: File Not Found.\n` +
        slices[0] +
        boldText(redText(slices[1])) +
        slices[2] +
        "\n" +
        " ".repeat(token.index - line.fromIndex) +
        "^",
    );
  },
  DisallowedToken: (tokenizer: Tokenizer, ...expected: ParsedTokenType[]) => {
    let token = tokenizer.token()!;
    let line = tokenizer.locate();
    let slices = sliceText(
      line.line,
      token.index - line.fromIndex,
      token.index + token.token.length - line.fromIndex,
    );
    return new SyntaxError(
      `Unable to parse code: Disallowed Token Type.\n` +
        `Expected Type [${expected.join("], [")}], got (${token.type})\n` +
        slices[0] +
        boldText(redText(slices[1])) +
        slices[2] +
        "\n" +
        " ".repeat(token.index - line.fromIndex) +
        "^",
    );
  },
};

export enum ParsedTokenType {
  Loop,
  Block,
  File,
  Normal,
}
export type IParsedTokenData<T extends ParsedTokenType> =
  T extends ParsedTokenType.Loop
    ? {
        loopCount: number;
        code: ParsedToken<ParsedTokenType>;
      }
    : T extends ParsedTokenType.Block
      ? {
          code: ParsedToken<ParsedTokenType>[];
        }
      : T extends ParsedTokenType.File
        ? {
            filename: string;
          }
        : {};
export class ParsedToken<T extends ParsedTokenType> {
  public data = {} as IParsedTokenData<T>;
  constructor(
    public type: T,
    public token: IToken,
  ) {}

  public isLoop(): this is ParsedToken<ParsedTokenType.Loop> {
    return this.type == ParsedTokenType.Loop;
  }
  public isBlock(): this is ParsedToken<ParsedTokenType.Block> {
    return this.type == ParsedTokenType.Block;
  }
  public isFile(): this is ParsedToken<ParsedTokenType.File> {
    return this.type == ParsedTokenType.File;
  }
  public isNormal(): this is ParsedToken<ParsedTokenType.Normal> {
    return this.type == ParsedTokenType.Normal;
  }
  public toString(indent = 2): string {
    if (this.isFile()) {
      const fileToken: ParsedToken<ParsedTokenType.File> = this;
      return `${fileToken.token.token}( ${fileToken.data.filename} )`;
    }
    if (this.isBlock()) {
      const blockToken: ParsedToken<ParsedTokenType.Block> = this;
      return `(\n${" ".repeat(indent)}${blockToken.data.code
        .map((token) => token.toString(indent * 2))
        .join("")
        .replace("\n", "\n" + " ".repeat(indent))}\n)`;
    }
    if (this.isLoop()) {
      const loopToken: ParsedToken<ParsedTokenType.Loop> = this;
      return `${loopToken.token.token}${loopToken.data.code.toString(indent)}`;
    }
    return this.token.token;
  }
}
export interface ParserOptions {
  checkFiles: boolean;
}
export const DefaultParserOptions: ParserOptions = {
  checkFiles: true,
};
export class Parser {
  public static readonly LoopValues = {
    "?": 2,
    "!": 1,
  };
  public static Parse(code: string, options?: Partial<ParserOptions>) {
    return new this(Tokenizer.Tokenize(code), options);
  }
  public static ParseLoopCount(token: string) {
    if (token.startsWith("[") && token.endsWith("]"))
      token = token.slice(1, -1);
    return [...token].reduce(
      (a, b) => a + this.LoopValues[b as keyof typeof this.LoopValues],
      0,
    );
  }

  #tokenizer: Tokenizer;
  public tokens: ParsedToken<ParsedTokenType>[] = [];
  public options: ParserOptions;
  public constructor(
    tokenizer: Tokenizer,
    options: Partial<ParserOptions> = DefaultParserOptions,
  ) {
    this.options = {
      ...DefaultParserOptions,
      ...options,
    };
    this.#tokenizer = tokenizer;
    for (;;) {
      const token = tokenizer.token();
      if (!token) break;
      if (token.type !== TokenType.Comment) {
        if (token.type == TokenType.Unknown)
          throw ParserError.Unknown(tokenizer);
        if (token.type == TokenType.Looper) {
          let parsedToken = new ParsedToken(ParsedTokenType.Loop, token);
          let count = Parser.ParseLoopCount(token.token);
          parsedToken.data.loopCount = count;
          // retrive code to loop
          tokenizer.index++;
          let toLoop = tokenizer.token();
          if (toLoop) {
            if (toLoop.type !== TokenType.Comment) {
              if (toLoop.type == TokenType.Unknown)
                throw ParserError.Unknown(tokenizer);
              parsedToken.data.code = Parser.Parse(toLoop.token).tokens[0];
              this.tokens.push(parsedToken);
            }
          }
        }
        if (token.type == TokenType.Block) {
          let parsedToken = new ParsedToken(ParsedTokenType.Block, token);
          let code = token.token.slice(1, -1);
          parsedToken.data.code = Parser.Parse(code).tokens;
          this.tokens.push(parsedToken);
        }
        if (token.type == TokenType.Reserved) {
          let info = Tokenizer.ReservedTokenInfo(token);
          if (info.fileHead) {
            let parsedToken = new ParsedToken(ParsedTokenType.File, token);
            // retrive file name
            tokenizer.index++;
            let fileNameToken = tokenizer.token();
            if (fileNameToken) {
              if (fileNameToken.type !== TokenType.Comment) {
                if (fileNameToken.type == TokenType.Unknown)
                  throw ParserError.Unknown(tokenizer);
                if (fileNameToken.type !== TokenType.Block)
                  throw ParserError.DisallowedToken(
                    tokenizer,
                    ParsedTokenType.Block,
                  );
                parsedToken.data.filename = fileNameToken.token.slice(1, -1);
                if (this.options.checkFiles) {
                  let filename = parsedToken.data.filename;
                  let ext = extname(filename);
                  if (ext !== ".lzs") throw ParserError.InvalidFile(tokenizer);
                  if (filename.startsWith("#"))
                    filename = join(process.cwd(), filename.slice(1));
                  if (!existsSync(filename))
                    throw ParserError.InvalidFile(tokenizer);
                }
                this.tokens.push(parsedToken);
              }
            }
          }
          if (
            info[0] ||
            info[1] ||
            info.pointerNext ||
            info.pointerPrevious ||
            info.print ||
            info.log
          ) {
            this.tokens.push(new ParsedToken(ParsedTokenType.Normal, token));
          }
        }
      }
      tokenizer.index++;
    }
  }
  public get tokenizer() {
    return this.#tokenizer;
  }
  public get size() {
    return this.tokens.length;
  }
  public toString(indent = 2) {
    return this.tokens.map((token) => token.toString(indent)).join("");
  }
  public code() {
    return this.#tokenizer.code;
  }
}
