import { Parser } from "./Parser";
import { Tokenizer } from "./Tokenizer";

/**
 * Enum representing the different ways of reverse interpretation.
 */
export enum ReverseInterpretType {
  /** Encode and print each character individually */
  CharacterByCharacter,
  /** List all the characters at the start, then print them by adjusting the pointer */
  PreloadAndPrint,
}

/**
 * Mapping of ReverseInterpretType to corresponding reverse interpretation functions.
 */
const _ReverseInterpreter: Record<
  ReverseInterpretType,
  (text: string) => string
> = {
  /**
   * Encodes each character individually and prints them sequentially.
   * @param text - The input text to interpret.
   * @returns The generated code.
   */
  [ReverseInterpretType.CharacterByCharacter]: function (text: string) {
    let code = "";
    for (let i = 0; i < text.length; i++) {
      const character = text[i];
      code += ReverseInterpreter.ConvertN(character.charCodeAt(0)) + ".>";
    }
    return code.slice(0, -1);
  },

  /**
   * Preloads all characters at the start, then prints them by adjusting the pointer.
   * @param text - The input text to interpret.
   * @returns The generated code.
   */
  [ReverseInterpretType.PreloadAndPrint]: function (text: string): string {
    let code = "";
    let preloadMap = new Map<string, number>();
    for (let i = 0; i < text.length; i++) {
      const character = text[text.length - 1 - i];
      if (!preloadMap.has(character)) {
        preloadMap.set(character, preloadMap.size + 1);
        code += ReverseInterpreter.ConvertN(character.charCodeAt(0)) + ">";
      }
    }
    code = code.slice(0, -1);
    let current = preloadMap.size;
    for (let i = 0; i < text.length; i++) {
      const character = text[i];
      let index = preloadMap.get(character)!;
      code +=
        "><"[current > index ? 1 : 0].repeat(Math.abs(current - index)) + ".";
      current = index;
    }
    return code;
  },
};

/**
 * Options for the ReverseInterpreter.
 */
export interface IReverseInterpreterOptions {
  /** The interpretation type to use. */
  type: ReverseInterpretType;
  /** Whether to minify the output code. */
  minify: boolean;
}

/**
 * Class responsible for reverse interpreting text into code.
 */
export class ReverseInterpreter {
  /**
   * Minifies the generated code by reducing redundant token sequences.
   * @param code - The code to minify.
   * @returns The minified code.
   */
  private static MinifyCode(code: string): string {
    function getLoopCharacters(n: number): string {
      if (n < 1) return "";
      let map = Object.entries(Parser.LoopValues).sort((a, b) => b[1] - a[1]);
      let results = "";
      for (let i = 0; i < map.length; i++) {
        const value = map[i][1];
        while (n >= value) {
          results += map[i][0];
          n -= value;
        }
      }
      return results;
    }

    let tokenizer = Tokenizer.Tokenize(code);
    let minified = "";
    let previousTokens = [tokenizer.tokens[0]];
    for (let i = 1; i < tokenizer.tokens.length; i++) {
      const token = tokenizer.tokens[i];
      let last = previousTokens[previousTokens.length - 1];
      if (last.type == token.type && last.token == token.token) {
        previousTokens.push(token);
      } else {
        let n = previousTokens.length;
        let loopChars = getLoopCharacters(n);
        minified +=
          2 + last.token.length + loopChars.length >= n * last.token.length
            ? last.token.repeat(n)
            : `[${loopChars}]${last.token}`;
        previousTokens = [token];
      }
    }
    if (previousTokens.length) {
      let last = previousTokens[previousTokens.length - 1];
      let n = previousTokens.length;
      let loopChars = getLoopCharacters(n);
      minified +=
        2 + last.token.length + loopChars.length >= n * last.token.length
          ? last.token.repeat(n)
          : `[${loopChars}]${last.token}`;
    }
    return minified;
  }

  /**
   * Converts a number to a binary-like encoded format.
   * @param n - The number to convert.
   * @returns The encoded string.
   */
  public static ConvertN(n: number): string {
    return n.toString(2).replace(/[10]/g, (i) => (i == "1" ? "[[]]" : "[]"));
  }

  /**
   * Reverse interprets the given text into code.
   * @param text - The input text.
   * @param opts - Optional parameters for interpretation.
   * @returns An object containing the generated code, options used, and execution time.
   * @throws {TypeError} If input text is not a valid string.
   */
  public static ReverseInterpret(
    text: string,
    opts: Partial<IReverseInterpreterOptions> = {},
  ) {
    let start = performance.now();
    if (typeof text !== "string")
      throw new TypeError(`Expected text to be a string, got ${typeof text}`);
    if (text.length < 1)
      throw new TypeError(`Expected text to be a non-empty string.`);

    opts = {
      type: opts.type ?? ReverseInterpretType.CharacterByCharacter,
      minify: Boolean(opts.minify),
    };

    let code = _ReverseInterpreter[opts.type!](text);
    if (opts.minify) code = this.MinifyCode(code);
    return { code, options: opts, executionTime: performance.now() - start };
  }
}
