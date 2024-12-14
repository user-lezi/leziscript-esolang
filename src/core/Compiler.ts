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

const CompileCodeFor = {
  Loop: function (
    count: number,
    iteratorKey: string,
    codeLines: string[],
    indent: number,
  ) {
    let indentedLines = codeLines
      .filter((x) => x)
      .map((x) => " ".repeat(indent) + x)
      .join("\n");
    return `for(let ${iteratorKey} = 0; ${iteratorKey} < ${count}; ${iteratorKey}++) {\n${indentedLines}\n}`;
  },
};

export interface ICompilerOptions {
  parser: ParserOptions;
  codeIndent: number;
  minify: boolean;
}
export const DefaultCompilerOption: ICompilerOptions = {
  parser: DefaultParserOptions,
  codeIndent: 2,
  minify: false,
};
export class Compiler {
  public static Compile(code: string, options?: Partial<ICompilerOptions>) {
    return new this(Parser.Parse(code, options?.parser), options);
  }
  #parser: Parser;
  #tokenizer: Tokenizer;
  public options: ICompilerOptions;
  public constructor(
    parser: Parser,
    options: Partial<ICompilerOptions> = DefaultCompilerOption,
  ) {
    this.#parser = parser;
    this.#tokenizer = parser.tokenizer;
    this.options = { ...DefaultCompilerOption, ...options };
  }

  public get parser() {
    return this.#parser;
  }
  public get tokenizer() {
    return this.#tokenizer;
  }
  public get code() {
    return this.#parser.code();
  }

  public async run() {
    let executionTimeStart = performance.now();
    let initialCode = `/* Initial Definations */\npointer = 0;\nbits = new Int32Array(3000);\noutput = "";\nfunction _print() {\n${" ".repeat(this.options.codeIndent)}return String.fromCharCode(bits[pointer])\n}\n`;
    let outputCodeLines: string[] = splitlines(initialCode);
    for (let i = 0; i < this.#parser.tokens.length; i++) {
      let compiled = compileToken(this.#parser.tokens[i], this);
      if (compiled.length) outputCodeLines.push(...compiled);
    }
    let outputCode = outputCodeLines.join("\n");
    if (this.options.minify) {
      outputCode = minify(outputCode, {
        toplevel: true,
        mangle: {
          toplevel: true,
          reserved: ["output"],
        },
        compress: {},
      }).code;
      outputCode += "return output;";
    } else outputCode += `\nreturn output;`;
    const indentedCode = splitlines(outputCode)
      .map((line) => " ".repeat(this.options.codeIndent) + line)
      .join("\n");

    outputCode = `function main() {\n${indentedCode}\n}`;
    return {
      outputCode,
      exectionTime: performance.now() - executionTimeStart,
    };
  }
}

function compileToken(
  token: ParsedToken<ParsedTokenType>,
  compiler: Compiler,
): string[] {
  let output: string[] = [];
  if (token.isBlock()) {
    let subtokens = token.data.code;
    for (let i = 0; i < subtokens.length; i++) {
      output.push(...compileToken(subtokens[i], compiler));
    }
  } else if (token.isFile()) {
    let name = resolveFileName(token.data.filename);
    let contents = readFileSync(name, "utf8");
    let subtokens = Parser.Parse(contents, compiler.parser.options).tokens;
    for (let i = 0; i < subtokens.length; i++) {
      output.push(...compileToken(subtokens[i], compiler));
    }
  } else if (token.isLoop()) {
    let codeLines = compileToken(token.data.code, compiler);
    let loopStatement = splitlines(
      CompileCodeFor.Loop(
        token.data.loopCount,
        "iterator_" + Math.floor(Math.random() * 1000),
        codeLines,
        compiler.options.codeIndent,
      ),
    );
    output.push(...loopStatement);
  } else if (token.isNormal()) {
    /* Actual working */
    let info = token.data;
    // refer from Interpreter.ts
    if (info.pointerNext || info.pointerPrevious) {
      output.push(`pointer += ${info.pointerNext ? 1 : -1};`);
    } else if (info.print) {
      output.push(`output += _print();`);
    } else if (info.log) {
      output.push(`console.log(_print());`);
    } else if (info[0] || info[1]) {
      output.push(`bits[pointer] <<= 1;`);
      if (info[1]) output.push(`bits[pointer]++;`);
    }
  }
  return output;
}

function splitlines(str: string) {
  return str.split("\n");
}
