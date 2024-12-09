import { boldText, redText } from "../util";

export interface IToken {
  token: string;
  index: number;
  type: TokenType;
}

export enum TokenType {
  Unknown,
  Comment,
  Looper,
  Reserved,
  Block,
}
export class Tokenizer {
  public static readonly CommentChar = '"';
  public static readonly Reserved = "[[]] [] < > @ . #".split(" ");

  public static ReservedTokenInfo(token: IToken) {
    const is = (s: string) => token.token == s;
    return {
      1: is("[[]]"),
      0: is("[]"),
      pointerNext: is(">"),
      pointerPrevious: is("<"),
      fileHead: is("@"),
      print: is("."),
      log: is("#"),
    };
  }
  private static RawTokenize(code: string) {
    if (typeof code !== "string")
      throw new TypeError(`Expected code to be a string, got ${typeof code}`);
    if (code.length < 1)
      throw new TypeError(`Expected code to be a non-empty string.`);

    let commentChar = this.CommentChar;
    let inComment = false;
    let blockDepth = 0;
    let tokens: string[] = [];
    let currentToken = "";
    let depth = 0;
    for (let i = 0; i < code.length; i++) {
      let char = code[i];
      if (inComment) {
        currentToken += char;
        if (char == commentChar) {
          inComment = false;
          if (currentToken) {
            tokens.push(currentToken);
            currentToken = "";
          }
        }
        continue;
      }
      if (char == commentChar) {
        if (currentToken) {
          tokens.push(currentToken);
          currentToken = "";
        }
        currentToken += char;
        inComment = true;
        continue;
      }

      let info = charInfo(char);
      if (info.blockOpen) blockDepth++;
      if (info.blockClose) blockDepth--;
      if (info.open) depth++;
      if (info.close) depth--;
      if (info.blockOpen && blockDepth == 1 && currentToken) {
        tokens.push(currentToken);
        currentToken = "";
      }
      if (info.open && depth == 1 && blockDepth == 0 && currentToken) {
        tokens.push(currentToken);
        currentToken = "";
      }
      currentToken += char;
      if (info.blockClose && blockDepth == 0) {
        tokens.push(currentToken);
        currentToken = "";
      }
      if (info.close && depth == 0 && blockDepth == 0) {
        tokens.push(currentToken);
        currentToken = "";
      }
    }
    if (inComment) throw new SyntaxError("Unterminated Comment");
    if (depth > 0)
      throw new SyntaxError(
        `Unclosed Brackets (${depth})\n> From: ${code.slice(code.lastIndexOf(currentToken))}`,
      );
    if (blockDepth > 0)
      throw new SyntaxError(
        `Unclosed Block (${blockDepth})\n> From: ${code.slice(code.lastIndexOf(currentToken))}`,
      );
    if (currentToken) {
      tokens.push(currentToken);
      currentToken = "";
    }
    return tokens;
  }

  public static Tokenize(code: string) {
    let rawTokens = this.RawTokenize(code);
    let tokens: IToken[] = [];
    let lastTokenIndex = -1;
    for (let i = 0; i < rawTokens.length; i++) {
      let raw = rawTokens[i].trim();
      if (!raw.length) continue;
      let subtokens: string[];
      if (
        (raw[0] == "(" && raw.slice(-1) == ")") ||
        (raw[0] == "[" && raw.slice(-1) == "]") ||
        (raw[0] == this.CommentChar && raw.slice(-1) == this.CommentChar)
      )
        subtokens = [raw];
      else subtokens = [...raw];

      for (let j = 0; j < subtokens.length; j++) {
        let subtoken = subtokens[j];
        let index = code.indexOf(subtoken, lastTokenIndex);
        lastTokenIndex = index;

        tokens.push({
          token: subtoken,
          index,
          type: this.GetTokenType(subtoken),
        });
      }
    }
    return new this(tokens, code);
  }

  private static GetTokenType(token: string): TokenType {
    if (token[0] == this.CommentChar && token.slice(-1) == this.CommentChar)
      return TokenType.Comment;
    if (token[0] == "(" && token.slice(-1) == ")") return TokenType.Block;
    if (
      token.length > 2 &&
      token[0] == "[" &&
      token.slice(-1) == "]" &&
      token.slice(1, -1).replace(/^[?!]+$/, "").length == 0
    )
      return TokenType.Looper;
    if (this.Reserved.indexOf(token) > -1) return TokenType.Reserved;
    return TokenType.Unknown;
  }

  public index = 0;
  public codeLines = [] as { line: string; fromIndex: number }[];
  #codeLineIndexes: number[] = [];
  private constructor(
    public tokens: IToken[],
    public code: string,
  ) {
    let codeLines = this.code.split("\n");
    let lastLineIndex = -1;
    for (let i = 0; i < codeLines.length; i++) {
      const line = codeLines[i];
      let index = code.indexOf(line, lastLineIndex);
      lastLineIndex = index;
      this.codeLines.push({
        line,
        fromIndex: index,
      });
      this.#codeLineIndexes.push(index);
    }
  }
  public get size() {
    return this.tokens.length;
  }
  public getLine(index: number) {
    let lineIndex = this.#codeLineIndexes.length - 1;
    for (let i = 0; i < this.#codeLineIndexes.length; i++) {
      const j = this.codeLines[this.#codeLineIndexes.length - 1 - i];
      if (index >= j.fromIndex) {
        lineIndex = this.#codeLineIndexes.length - 1 - i;
        break;
      }
    }
    return this.codeLines[lineIndex];
  }

  public token(index: number = this.index) {
    if (index < 0 || index >= this.tokens.length) return null;
    return this.tokens[index];
  }

  public locate(token?: IToken) {
    token ??= this.token()!;
    return this.getLine(token.index);
  }
}

function charInfo(char: string) {
  return {
    open: char == "[",
    close: char == "]",
    blockOpen: char == "(",
    blockClose: char == ")",
  };
}
