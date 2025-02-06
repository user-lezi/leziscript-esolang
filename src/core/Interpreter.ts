import { readFileSync } from "fs";
import { resolveFileName } from "../util";
import {
  DefaultParserOptions,
  ParsedToken,
  ParsedTokenType,
  Parser,
  ParserOptions,
} from "./Parser";
import { Tokenizer } from "./Tokenizer";

/**
 * Interface defining the configuration options for the interpreter.
 */
export interface IInterpreterOptions {
  /**
   * If `true`, the interpreter will not log any output.
   * Default is `false`.
   */
  doNotLog: boolean;

  /**
   * Configuration options for the `Parser` instance used by the interpreter.
   */
  parser: ParserOptions;
}

/**
 * Default options for the interpreter.
 */
export const DefaultInterpreterOption: IInterpreterOptions = {
  /** Logs are enabled by default. */
  doNotLog: false,

  /** Uses the default parser options. */
  parser: DefaultParserOptions,
};

/**
 * A class responsible for interpreting parsed code and executing it based on a specific language structure.
 */
export class Interpreter {
  /**
   * Creates an instance of the interpreter by parsing the provided code and applying optional configuration.
   *
   * @param code - The source code to interpret.
   * @param options - Optional configuration for the interpreter, including parser settings.
   * @returns A new Interpreter instance.
   */
  public static Interpret(
    code: string,
    options?: Partial<IInterpreterOptions>,
  ) {
    return new this(Parser.Parse(code, options?.parser), options);
  }

  #parser: Parser;
  #tokenizer: Tokenizer;

  /**
   * Constructs a new Interpreter instance with the provided parser and options.
   *
   * @param parser - The parsed tokens.
   * @param options - Optional configuration for the interpreter (defaults to `DefaultInterpreterOption`).
   */
  public constructor(
    parser: Parser,
    public options: Partial<IInterpreterOptions> = DefaultInterpreterOption,
  ) {
    this.#parser = parser;
    this.#tokenizer = parser.tokenizer;
  }

  /**
   * Getter for the parser used by the interpreter.
   *
   * @returns The parser instance used by the interpreter.
   */
  public get parser() {
    return this.#parser;
  }

  /**
   * Getter for the tokenizer used by the parser.
   *
   * @returns The tokenizer instance used by the parser.
   */
  public get tokenizer() {
    return this.#tokenizer;
  }

  /**
   * Getter for the source code being interpreted.
   *
   * @returns The original source code.
   */
  public get code() {
    return this.#parser.code();
  }

  /**
   * Runs the interpretation of the parsed code, simulating the execution and producing output.
   *
   * @returns An object containing the internal state of the interpreter, the output produced, and the execution time.
   */
  public run() {
    let executionTimeStart = performance.now();
    let internal = {
      pointer: 0,
      bits: new Int32Array(3000), // Memory representation
      print: function print() {
        return String.fromCharCode(this.bits[this.pointer]);
      },
    };
    let output = "";
    let queue: ParsedToken<ParsedTokenType>[] = [];
    queue.push(this.#parser.tokens.shift()!); // Start with the first token

    // Main loop for token processing
    while (queue.length > 0) {
      let token = queue.shift();
      if (token) {
        if (token.isBlock()) {
          // Handle block tokens (nested code execution)
          queue.unshift(...token.data.code);
        } else {
          if (token.isFile()) {
            // Handle file tokens (external files to be interpreted)
            let name = resolveFileName(token.data.filename);
            let contents = readFileSync(name, "utf8");
            let parsedTokens = Parser.Parse(
              contents,
              this.options.parser,
            ).tokens;
            queue.unshift(...parsedTokens); // Push parsed content of file to queue
          } else if (token.isLoop()) {
            // Handle loop tokens
            let count = token.data.loopCount;
            for (let i = 0; i < count; i++) {
              queue.unshift(token.data.code); // Loop the token code
            }
          } else if (token.isNormal()) {
            // Handle normal tokens (commands)
            let info = token.data;

            // Handle pointer movement tokens (< or >)
            if (info.pointerNext || info.pointerPrevious) {
              internal.pointer += info.pointerNext ? 1 : -1;
            } else if (info.print) {
              // Handle print command (.)
              output += internal.print();
            } else if (info.log && !this.options.doNotLog) {
              // Handle log command (#)
              console.log(internal.print());
            } else if (info.copy) {
              // Handle copy command (:)
              internal.bits[internal.pointer + 1] =
                internal.bits[internal.pointer];
              internal.pointer++;
            } else if (info.delete) {
              // Handle delete command (!)
              internal.bits[internal.pointer] >>= 1;
            } else if (info[0] || info[1]) {
              // Handle value setting commands (e.g., [[]] or [])
              internal.bits[internal.pointer] <<= 1;
              if (info[1]) internal.bits[internal.pointer] += 1;
            }
          }
        }
        // Fetch the next token if the queue is empty and there are more tokens to process
        if (queue.length == 0 && this.#parser.tokens.length > 0)
          queue.push(this.#parser.tokens.shift()!);
      }
    }

    // Return the result of the interpretation
    return {
      internal, // Internal memory and state
      output, // Output produced by the interpreter
      executionTime: performance.now() - executionTimeStart, // Time taken to run the code
    };
  }
}
