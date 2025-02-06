import { IToken, Tokenizer, TokenType } from "./Tokenizer";
import { boldText, redText, resolveFileName, sliceText } from "../util";
import { extname } from "path";
import { existsSync } from "fs";

/**
 * A collection of functions to generate syntax errors during parsing.
 * Each function returns a `SyntaxError` with a detailed message indicating the error type,
 * the problematic token, and its position in the code.
 */
const ParserError = {
  /**
   * Generates a `SyntaxError` for an unknown token type.
   * @param tokenizer The `Tokenizer` instance containing the token and code context.
   * @returns A `SyntaxError` with a message indicating that an unknown token type was found.
   */
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

  /**
   * Generates a `SyntaxError` for an invalid file reference.
   * @param tokenizer The `Tokenizer` instance containing the token and code context.
   * @returns A `SyntaxError` with a message indicating that a file was not found.
   */
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

  /**
   * Generates a `SyntaxError` for a disallowed token type.
   * @param tokenizer The `Tokenizer` instance containing the token and code context.
   * @param expected An array of expected token types.
   * @returns A `SyntaxError` with a message indicating the disallowed token type and the expected types.
   */
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

/**
 * Enum representing different parsed token types.
 */
export enum ParsedTokenType {
  /** Represents a loop token type. */
  Loop,
  /** Represents a block token type. */
  Block,
  /** Represents a file token type. */
  File,
  /** Represents a normal token type. */
  Normal,
}

/**
 * Represents the parsed token data structure for different `ParsedTokenType` values.
 * The structure of the data varies based on the token type.
 *
 * @template T The specific `ParsedTokenType` for which the data structure is defined.
 */
export type IParsedTokenData<T extends ParsedTokenType> =
  T extends ParsedTokenType.Loop
    ? {
        /** The number of times the loop should execute. */
        loopCount: number;
        /** The code contained within the loop, represented as a `ParsedToken`. */
        code: ParsedToken<ParsedTokenType>;
      }
    : T extends ParsedTokenType.Block
      ? {
          /** An array of `ParsedToken` objects representing the code within the block. */
          code: ParsedToken<ParsedTokenType>[];
        }
      : T extends ParsedTokenType.File
        ? {
            /** The filename associated with the token. */
            filename: string;
          }
        : ReturnType<typeof Tokenizer.ReservedTokenInfo>;

/**
 * Represents a parsed token with a specific type and associated data.
 * Provides utility methods for checking the token type and converting it to a string.
 *
 * @template T The specific `ParsedTokenType` associated with this token.
 */
export class ParsedToken<T extends ParsedTokenType> {
  /** The data associated with the parsed token, structured based on its type. */
  public data = {} as IParsedTokenData<T>;

  /**
   * Creates an instance of `ParsedToken`.
   * @param type The type of the token (`ParsedTokenType`).
   * @param token The raw token (`IToken`) associated with this parsed token.
   */
  constructor(
    public type: T,
    public token: IToken,
  ) {}

  /**
   * Checks if the token is of type `ParsedTokenType.Loop`.
   * @returns `true` if the token is a loop; otherwise, `false`.
   */
  public isLoop(): this is ParsedToken<ParsedTokenType.Loop> {
    return this.type == ParsedTokenType.Loop;
  }

  /**
   * Checks if the token is of type `ParsedTokenType.Block`.
   * @returns `true` if the token is a block; otherwise, `false`.
   */
  public isBlock(): this is ParsedToken<ParsedTokenType.Block> {
    return this.type == ParsedTokenType.Block;
  }

  /**
   * Checks if the token is of type `ParsedTokenType.File`.
   * @returns `true` if the token is a file; otherwise, `false`.
   */
  public isFile(): this is ParsedToken<ParsedTokenType.File> {
    return this.type == ParsedTokenType.File;
  }

  /**
   * Checks if the token is of type `ParsedTokenType.Normal`.
   * @returns `true` if the token is a normal token; otherwise, `false`.
   */
  public isNormal(): this is ParsedToken<ParsedTokenType.Normal> {
    return this.type == ParsedTokenType.Normal;
  }

  /**
   * Converts the token to a formatted string representation.
   * @param indent The indentation level for nested tokens (default is 2 spaces).
   * @returns A string representing the token and its associated data.
   */
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

/**
 * Represents options for configuring the parser.
 */
export interface ParserOptions {
  /** Whether to check for the existence of files during parsing. */
  checkFiles: boolean;
}

/**
 * The default options for the parser.
 */
export const DefaultParserOptions: ParserOptions = {
  /** Enables file existence checks by default. */
  checkFiles: true,
};

/**
 * The `Parser` class parses a series of tokens generated by the `Tokenizer`.
 * It supports parsing loops, blocks, files, and reserved tokens, while handling errors and file validation.
 */
export class Parser {
  /** Mapping of special loop symbols to their respective loop counts. */
  public static readonly LoopValues = {
    "?": 2,
    "!": 1,
  };

  /**
   * Parses a string of code into a `Parser` instance with parsed tokens.
   * @param code The input code to parse.
   * @param options Optional parser configuration.
   * @returns A new instance of the `Parser` with parsed tokens.
   */
  public static Parse(code: string, options?: Partial<ParserOptions>) {
    return new this(Tokenizer.Tokenize(code), options);
  }

  /**
   * Parses a loop count from a token containing loop symbols.
   * Supports special syntax with `[` and `]` brackets.
   * @param token The token containing loop symbols (`?`, `!`).
   * @returns The total loop count based on the token.
   */
  public static ParseLoopCount(token: string) {
    if (token.startsWith("[") && token.endsWith("]")) {
      token = token.slice(1, -1);
    }
    return [...token].reduce(
      (a, b) => a + this.LoopValues[b as keyof typeof this.LoopValues],
      0,
    );
  }

  /** Internal tokenizer used for parsing. */
  #tokenizer: Tokenizer;

  /** List of parsed tokens of various types. */
  public tokens: ParsedToken<ParsedTokenType>[] = [];

  /** Parser configuration options. */
  public options: ParserOptions;

  /**
   * Creates an instance of `Parser`.
   * @param tokenizer The tokenizer containing the list of tokens to parse.
   * @param options Optional parser configuration (defaults to `DefaultParserOptions`).
   */
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
        if (token.type === TokenType.Unknown)
          throw ParserError.Unknown(tokenizer);

        if (token.type === TokenType.Looper) {
          let parsedToken = new ParsedToken(ParsedTokenType.Loop, token);
          let count = Parser.ParseLoopCount(token.token);
          parsedToken.data.loopCount = count;

          // Retrieve the code to loop
          tokenizer.index++;
          let toLoop = tokenizer.token();
          if (toLoop) {
            if (toLoop.type !== TokenType.Comment) {
              if (toLoop.type === TokenType.Unknown)
                throw ParserError.Unknown(tokenizer);
              parsedToken.data.code = Parser.Parse(toLoop.token).tokens[0];
              this.tokens.push(parsedToken);
            }
          }
        }

        if (token.type === TokenType.Block) {
          let parsedToken = new ParsedToken(ParsedTokenType.Block, token);
          let code = token.token.slice(1, -1);
          parsedToken.data.code = Parser.Parse(code).tokens;
          this.tokens.push(parsedToken);
        }

        if (token.type === TokenType.Reserved) {
          let info = Tokenizer.ReservedTokenInfo(token);

          if (info.fileHead) {
            let parsedToken = new ParsedToken(ParsedTokenType.File, token);

            // Retrieve file name
            tokenizer.index++;
            let fileNameToken = tokenizer.token();
            if (fileNameToken) {
              if (fileNameToken.type !== TokenType.Comment) {
                if (fileNameToken.type === TokenType.Unknown)
                  throw ParserError.Unknown(tokenizer);
                if (fileNameToken.type !== TokenType.Block)
                  throw ParserError.DisallowedToken(
                    tokenizer,
                    ParsedTokenType.Block,
                  );

                parsedToken.data.filename = fileNameToken.token.slice(1, -1);

                if (this.options.checkFiles) {
                  let filename = resolveFileName(parsedToken.data.filename);
                  let ext = extname(filename);
                  if (ext !== ".lzs") throw ParserError.InvalidFile(tokenizer);
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
            info.log ||
            info.copy ||
            info.delete
          ) {
            let parsedToken = new ParsedToken(ParsedTokenType.Normal, token);
            parsedToken.data = info;
            this.tokens.push(parsedToken);
          }
        }
      }

      tokenizer.index++;
    }
  }

  /** Returns the internal tokenizer used by the parser. */
  public get tokenizer() {
    return this.#tokenizer;
  }

  /** The total number of parsed tokens. */
  public get size() {
    return this.tokens.length;
  }

  /**
   * Converts the entire parsed token list to a string representation.
   * @param indent The indentation level for nested tokens (default is 2 spaces).
   * @returns A string representing the parsed tokens.
   */
  public toString(indent = 2) {
    return this.tokens.map((token) => token.toString(indent)).join("");
  }

  /**
   * Returns the original code processed by the parser.
   * @returns The original code string.
   */
  public code() {
    return this.#tokenizer.code;
  }
}
