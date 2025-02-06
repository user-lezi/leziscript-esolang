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
import { minify } from "uglify-js";

/**
 * An object containing methods to compile code for different constructs.
 */
const CompileCodeFor = {
  /**
   * Compiles code to a loop structure (for loop) in JavaScript.
   *
   * @param count - The number of iterations for the loop.
   * @param iteratorKey - The key/variable name for the iterator (e.g., "i").
   * @param codeLines - The lines of code to be executed within the loop.
   * @param indent - The number of spaces to use for indentation in the generated code.
   * @returns The compiled JavaScript code as a string with the loop structure.
   */
  Loop: function (
    count: number,
    iteratorKey: string,
    codeLines: string[],
    indent: number,
  ) {
    let indentedLines = codeLines
      .filter((x) => x) // Filter out empty lines
      .map((x) => " ".repeat(indent) + x) // Indent each line of code
      .join("\n");
    return `for(let ${iteratorKey} = 0; ${iteratorKey} < ${count}; ${iteratorKey}++) {\n${indentedLines}\n}`; // Return the for loop code
  },
};

/**
 * The options used for the compiler, including parsing settings, code indentation, and minification.
 */
export interface ICompilerOptions {
  /**
   * The options for the parser.
   */
  parser: ParserOptions;

  /**
   * The number of spaces to use for indentation in the generated code.
   */
  codeIndent: number;

  /**
   * Whether to minify the compiled code (removes unnecessary whitespace and line breaks).
   */
  minify: boolean;
}

/**
 * The default compiler options.
 */
export const DefaultCompilerOption: ICompilerOptions = {
  parser: DefaultParserOptions, // Use default parser options
  codeIndent: 2, // Default indentation of 2 spaces
  minify: false, // Do not minify the code by default
};

/**
 * The Compiler class is responsible for converting parsed code into executable JavaScript.
 * It provides the functionality to compile code into a JavaScript function with support for loops, printing, and other constructs.
 */
export class Compiler {
  /**
   * Static method to compile code using the given options.
   *
   * @param code - The code to compile.
   * @param options - Optional compiler options.
   * @returns A new instance of the `Compiler` class with the compiled output code.
   */
  public static Compile(code: string, options?: Partial<ICompilerOptions>) {
    return new this(Parser.Parse(code, options?.parser), options);
  }

  #parser: Parser;
  #tokenizer: Tokenizer;
  #loop_iterator = 0;
  public options: ICompilerOptions;

  /**
   * Constructs a `Compiler` instance with the given parser and options.
   *
   * @param parser - The parser that has already parsed the input code.
   * @param options - Compiler options, including indentation and minification settings.
   */
  public constructor(
    parser: Parser,
    options: Partial<ICompilerOptions> = DefaultCompilerOption,
  ) {
    this.#parser = parser;
    this.#tokenizer = parser.tokenizer;
    this.options = { ...DefaultCompilerOption, ...options };
  }

  /**
   * Increments the loop iterator count.
   * This is used for generating unique iterator variable names in loops.
   *
   * @returns The next loop iterator count.
   */
  public __incLoopIteratorCount() {
    return this.#loop_iterator++;
  }

  /**
   * Returns the parser used by the compiler.
   */
  public get parser() {
    return this.#parser;
  }

  /**
   * Returns the tokenizer used by the compiler.
   */
  public get tokenizer() {
    return this.#tokenizer;
  }

  /**
   * Returns the raw code passed to the parser.
   */
  public get code() {
    return this.#parser.code();
  }

  /**
   * Runs the compilation process, converting the parsed tokens into executable JavaScript code.
   *
   * @returns An object containing the compiled output code and the execution time.
   */
  public run() {
    let executionTimeStart = performance.now();
    let initialCode = `/* Initial Definitions */\nlet pointer = 0;\nlet bits = new Int32Array(3000);\nlet output = "";\nfunction _print() {\n${" ".repeat(this.options.codeIndent)}return String.fromCharCode(bits[pointer])\n}\n`;
    let outputCodeLines: string[] = splitlines(initialCode);

    // Compile each token into executable JavaScript code
    for (let i = 0; i < this.#parser.tokens.length; i++) {
      let compiled = compileToken(this.#parser.tokens[i], this);
      if (compiled.length) outputCodeLines.push(...compiled);
    }

    // Minify the output code if required
    outputCodeLines = minifyOutput1(outputCodeLines);
    let outputCode = minifyOutput2(outputCodeLines.join("\n"));
    if (this.options.minify) {
      outputCode = minify(outputCode + "\nconsole.log(output);", {
        toplevel: true,
        compress: {},
      }).code;

      // Adjust the console log output
      outputCode = outputCode.endsWith(`console.log("");`)
        ? outputCode.replace(/[,;]?console\.log\(""\);$/, ';return "";')
        : outputCode.replace(
            /[,;]?console\.log\(\w+\);$/,
            (m) => `;return ${m.split("(")[1].slice(0, -2)};`,
          );
    } else outputCode += `\nreturn output;`;

    // Add indentation to the output code
    const indentedCode = splitlines(outputCode)
      .map((line) => " ".repeat(this.options.codeIndent) + line)
      .join("\n");

    outputCode = `function main() {\n${indentedCode}\n}`;

    // Return the compiled code and execution time
    return {
      outputCode,
      executionTime: performance.now() - executionTimeStart,
    };
  }
}

/**
 * Compiles a parsed token into executable JavaScript code.
 * The function handles various token types such as block, loop, file, and normal.
 * It recursively compiles block and file tokens and processes normal tokens to generate the corresponding JavaScript code.
 *
 * @param token - The parsed token to compile.
 * @param compiler - The compiler instance that provides configuration options for the compilation.
 * @returns An array of strings representing the compiled JavaScript code.
 */
function compileToken(
  token: ParsedToken<ParsedTokenType>,
  compiler: Compiler,
): string[] {
  let output: string[] = [];

  // If the token is a block, compile its contained tokens
  if (token.isBlock()) {
    let subtokens = token.data.code;
    for (let i = 0; i < subtokens.length; i++) {
      output.push(...compileToken(subtokens[i], compiler));
    }
  }
  // If the token is a file, read and compile its contents
  else if (token.isFile()) {
    let name = resolveFileName(token.data.filename);
    let contents = readFileSync(name, "utf8");
    let subtokens = Parser.Parse(contents, compiler.parser.options).tokens;
    for (let i = 0; i < subtokens.length; i++) {
      output.push(...compileToken(subtokens[i], compiler));
    }
  }
  // If the token is a loop, compile it with a loop statement
  else if (token.isLoop()) {
    let codeLines = compileToken(token.data.code, compiler);
    let loopStatement = splitlines(
      CompileCodeFor.Loop(
        token.data.loopCount,
        "iterator_" + compiler.__incLoopIteratorCount(),
        codeLines,
        compiler.options.codeIndent,
      ),
    );
    output.push(...loopStatement);
  }
  // If the token is a normal operation, compile it to its corresponding JavaScript code
  else if (token.isNormal()) {
    let info = token.data;

    // Pointer movement (either forward or backward)
    if (info.pointerNext || info.pointerPrevious) {
      output.push(`pointer += ${info.pointerNext ? 1 : -1};`);
    }
    // Print operation (output character)
    else if (info.print) {
      output.push(`output += _print();`);
    }
    // Log operation (log to console)
    else if (info.log) {
      output.push(`console.log(_print());`);
    }
    // Copy operation (duplicate current bit)
    else if (info.copy) {
      output.push(`bits[pointer + 1] = bits[pointer];`, `pointer++;`);
    }
    // Delete operation (shift current bit)
    else if (info.delete) {
      output.push(`bits[pointer] >>= 1;`);
    }
    // Increment or decrement bit value
    else if (info[0] || info[1]) {
      output.push(`bits[pointer] <<= 1;`);
      if (info[1]) output.push(`bits[pointer]++;`);
    }
  }

  return output;
}

/**
 * Splits a string into an array of lines.
 *
 * @param str - The string to split.
 * @returns An array of strings, where each string is a line from the input.
 */
function splitlines(str: string) {
  return str.split("\n");
}

/**
 * Minifies an array of code lines by merging adjacent lines where possible.
 * This function looks for patterns in the code (such as incrementing or shifting pointer values)
 * and attempts to combine multiple lines into one, reducing the overall code size.
 *
 * @param lines - An array of code lines to minify.
 * @returns A new array of minified code lines.
 */
function minifyOutput1(lines: string[]): string[] {
  if (lines.length < 3) return lines; // If there are fewer than 3 lines, no need to minify.

  let output: string[] = [lines.shift()!]; // Start with the first line.
  let linecount = lines.length;

  // Loop through each line to check for patterns and minify.
  for (let i = 1; i < linecount + 1; i++) {
    let lastline = output[output.length - 1]; // Get the last added line.
    let line = lines.shift();
    if (line == undefined) break; // If no more lines, exit the loop.
    if (!line.length) continue; // Skip empty lines.

    let type = getLineType(line); // Get the type of the current line.

    // Check if the current line can be merged with the last line.
    if (type && isLastLineSame(line, lastline)) {
      let indent = " ".repeat(getLineIndent(lastline)); // Get indentation of the last line.

      // Handle different types of line merging.
      if (type == LastLineType.Shift) {
        let n = Number(parseLastLine(lastline, type)); // Parse the number from the last line.
        let m = Number(parseLastLine(line, type)); // Parse the number from the current line.
        output.pop(); // Remove the last line.
        output.push(`${indent}bits[pointer] <<= ${n + m};`); // Merge and add the new line.
      } else if (type == LastLineType.Delete) {
        let n = Number(parseLastLine(lastline, type));
        let m = Number(parseLastLine(line, type));
        output.pop();
        output.push(`${indent}bits[pointer] >>= ${n + m};`);
      } else if (type == LastLineType.Pointer) {
        let n = Number(parseLastLine(lastline, type));
        let m = Number(parseLastLine(line, type));
        let mn = m + n;
        output.pop();
        if (mn) output.push(`${indent}pointer += ${mn};`);
      } else if (type == LastLineType.Output) {
        let n = Number(parseLastLine(lastline, type));
        output.pop();
        output.push(`${indent}output += _print().repeat(${n + 1});`);
      } else {
        throw new Error("not possible"); // This should never happen.
      }
    } else output.push(line); // If no merging is possible, add the current line as-is.
  }

  return output;
}

/**
 * Minifies the JavaScript code by converting negative pointer increments into subtraction syntax.
 * This function helps optimize pointer movement operations like `pointer += -1` into `pointer -= 1`.
 *
 * @param code - The JavaScript code as a string.
 * @returns The minified code with adjusted pointer increments.
 */
function minifyOutput2(code: string): string {
  return code.replace(
    /pointer \+= -\d+;/g, // Match the pattern `pointer += -<number>`.
    (m) => `pointer -= ${m.split("-")[1]}`, // Replace it with `pointer -= <number>`.
  );
}

/**
 * Enum representing the different types of lines that can appear in the code.
 */
enum LastLineType {
  Shift = 1, // Represents a line shifting the pointer left (<<).
  Delete, // Represents a line shifting the pointer right (>>).
  Pointer, // Represents a line incrementing or decrementing the pointer (+= or -=).
  Output, // Represents a line appending to the output (output += _print()).
}

/**
 * Gets the indentation level of a line by counting the number of leading spaces.
 *
 * @param line - A single line of code.
 * @returns The number of spaces before any non-space character in the line.
 */
function getLineIndent(line: string): number {
  for (let i = 0; i < line.length; i++) {
    if (/[^ ]/.test(line[i])) return i; // Return the index of the first non-space character.
  }
  return 0; // If no non-space characters are found, return 0.
}

/**
 * Determines the type of a given line of code.
 *
 * @param line - A single line of code to check.
 * @returns The type of line as a `LastLineType` enum value, or `null` if the line does not match any known pattern.
 */
function getLineType(line: string): LastLineType | null {
  if (!line) return null; // If the line is empty, return null.
  line = line.trim(); // Trim the line of leading and trailing whitespace.

  // Match the line against known patterns and return the corresponding type.
  return /^bits\[pointer\] <<= \d+;$/.test(line)
    ? LastLineType.Shift
    : /^bits\[pointer\] >>= \d+;$/.test(line)
      ? LastLineType.Delete
      : /^pointer \+= -?\d+;$/.test(line)
        ? LastLineType.Pointer
        : /^output \+= _print\(\)(\.repeat\(\d+\))*;$/.test(line)
          ? LastLineType.Output
          : null;
}

/**
 * Checks if the current line is the same type as the previous line and has the same indentation.
 * This is used to determine if two lines can be merged together in the minification process.
 *
 * @param line - The current line.
 * @param lastline - The previous line.
 * @returns `true` if both lines have the same type and indentation, otherwise `false`.
 */
function isLastLineSame(line: string, lastline: string): boolean {
  if (lastline && line) {
    if (getLineIndent(line) == getLineIndent(lastline)) {
      // Check if both lines have the same indentation.
      let type = [getLineType(line), getLineType(lastline)];
      if (type[0] && type[1]) {
        return type[0] == type[1]; // Check if both lines have the same type.
      }
    }
  }
  return false; // Return false if the lines are not the same type or have different indentation.
}

/**
 * Parses the last part of a given line of code based on its type.
 *
 * This function extracts the relevant part of the line that corresponds to the operation
 * specified by the `type`. It handles shifts (`<<=`, `>>=`), pointer movements (`+=`),
 * and output operations (`+= _print().repeat(n)`), and returns the value associated
 * with that operation as a string.
 *
 * @param line - The line of code to parse.
 * @param type - The type of operation to parse, corresponding to a `LastLineType` enum.
 *
 * @returns The parsed value as a string based on the operation type.
 * If the line doesn't match the expected format for the given type, it returns an empty string.
 */
function parseLastLine<T extends LastLineType>(line: string, type: T): string {
  line = line.trim(); // Trim whitespace from the line to ensure clean parsing.
  switch (type) {
    case LastLineType.Shift:
      // Extracts the value from a line of the form: bits[pointer] <<= n;
      return line.split("<<= ")[1].slice(0, -1);
    case LastLineType.Delete:
      // Extracts the value from a line of the form: bits[pointer] >>= n;
      return line.split(">>= ")[1].slice(0, -1);
    case LastLineType.Pointer:
      // Extracts the value from a line of the form: pointer += n;
      return line.split("+= ")[1].slice(0, -1);
    case LastLineType.Output:
      // Extracts the repeat count from a line of the form: output += _print().repeat(n);
      let l = line.split("+= ")[1].slice(0, -1);
      return l.includes(".") ? l.split("(")[2].slice(0, -1) : "1";
    default:
      return ""; // Return empty string if no recognized type is matched.
  }
}
