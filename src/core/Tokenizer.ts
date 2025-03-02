/**
 * Interface representing a token in the system.
 */
export interface IToken {
  /**
   * The string value of the token.
   */
  token: string;

  /**
   * The index of the token in the source.
   */
  index: number;

  /**
   * The type of the token, defined by the TokenType enum.
   */
  type: TokenType;
}

/**
 * Enum representing the different types of tokens.
 */
export enum TokenType {
  /** The token type is unknown or not specified. */
  Unknown,

  /** The token represents a comment in the source. */
  Comment,

  /** The token represents a looping construct. */
  Looper,

  /** The token is a reserved keyword. */
  Reserved,

  /** The token represents a block structure (e.g., a code block). */
  Block,
}

/**
 * The Tokenizer class provides functionality to tokenize code strings into a set of tokens.
 * It supports identifying comments, reserved tokens, loops, and blocks within the code.
 */
export class Tokenizer {
  /** Character that indicates the start and end of a comment. */
  public static readonly CommentChar = '"';

  /** List of reserved symbols that represent specific token types. */
  public static readonly Reserved = "[[]] [] < > @ . # : !".split(" ");

  /**
   * Determines if a given token matches a reserved token and returns detailed token information.
   * @param token The token to check.
   * @returns An object mapping reserved token types to boolean values indicating a match.
   */
  public static ReservedTokenInfo(token: IToken) {
    const is = (s: string) => token.token === s;
    return {
      1: is("[[]]"),
      0: is("[]"),
      pointerNext: is(">"),
      pointerPrevious: is("<"),
      fileHead: is("@"),
      print: is("."),
      log: is("#"),
      copy: is(":"),
      delete: is("!"),
    };
  }

  /**
   * Tokenizes a raw code string into an array of token strings.
   * @param code The code string to tokenize.
   * @returns An array of token strings.
   * @throws {TypeError} If the code is not a string or is an empty string.
   * @throws {SyntaxError} If there are unmatched comments, brackets, or blocks.
   */
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
    if (currentToken) tokens.push(currentToken);
    return tokens;
  }

  /**
   * Tokenizes a code string into an array of IToken objects.
   * @param code The code string to tokenize.
   * @returns A new instance of the Tokenizer class containing the tokens and the original code.
   */
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

  /**
   * Determines the type of a token based on its format and content.
   * @param token The token string to classify.
   * @returns The TokenType of the token.
   */
  private static GetTokenType(token: string): TokenType {
    if (token[0] == this.CommentChar && token.slice(-1) == this.CommentChar)
      return TokenType.Comment;
    if (token[0] == "(" && token.slice(-1) == ")") return TokenType.Block;
    if (
      token.length > 2 &&
      token[0] == "[" &&
      token.slice(-1) == "]" &&
      token.slice(1, -1).replace(/^[&?!]+$/, "").length == 0
    )
      return TokenType.Looper;
    if (this.Reserved.indexOf(token) > -1) return TokenType.Reserved;
    return TokenType.Unknown;
  }

  public index = 0;
  public codeLines = [] as { line: string; fromIndex: number }[];
  #codeLineIndexes: number[] = [];
  /**
   * Constructs a new Tokenizer instance.
   * @param tokens An array of IToken objects representing the tokenized code.
   * @param code The original code string.
   */
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
  /** Returns the total number of tokens. */
  public get size() {
    return this.tokens.length;
  }

  /**
   * Retrieves the line of code corresponding to the specified index.
   * @param index The index of the character in the code.
   * @returns The line of code and its starting index.
   */
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

  /**
   * Retrieves a token by its index.
   * @param index The index of the token (defaults to the current token index).
   * @returns The token at the specified index, or null if the index is out of range.
   */
  public token(index: number = this.index) {
    if (index < 0 || index >= this.tokens.length) return null;
    return this.tokens[index];
  }

  /**
   * Locates the line of code containing the specified token.
   * @param token The token to locate (defaults to the current token).
   * @returns The line of code and its starting index.
   */
  public locate(token?: IToken) {
    token ??= this.token()!;
    return this.getLine(token.index);
  }
}

/**
 * Helper function to provide character information.
 * @param char The character to analyze.
 * @returns An object with properties indicating if the character opens/closes a block or bracket.
 */
function charInfo(char: string) {
  return {
    open: char === "[",
    close: char === "]",
    blockOpen: char === "(",
    blockClose: char === ")",
  };
}
