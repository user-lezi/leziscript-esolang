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
    let initialCode = `/* Initial Definations */\nlet pointer = 0;\nlet bits = new Int32Array(3000);\nlet output = "";\nfunction _print() {\n${" ".repeat(this.options.codeIndent)}return String.fromCharCode(bits[pointer])\n}\n`;
    let outputCodeLines: string[] = splitlines(initialCode);
    for (let i = 0; i < this.#parser.tokens.length; i++) {
      let compiled = compileToken(this.#parser.tokens[i], this);
      if (compiled.length) outputCodeLines.push(...compiled);
    }
    outputCodeLines = minifyOutput1(outputCodeLines);
    let outputCode = minifyOutput2(outputCodeLines.join("\n"));
    if (this.options.minify) {
      outputCode = minify(outputCode + "\nconsole.log(output);", {
        toplevel: true,
        compress: {},
      }).code;
      outputCode = outputCode.replace(
        /[,;]?console\.log\(\w+\);$/,
        (m) => `;return ${m.split("(")[1].slice(0, -2)};`,
      );
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
    } else if (info.copy) {
      output.push(`bits[pointer + 1] = bits[pointer];`, `pointer++;`);
    } else if (info.delete) {
      output.push(`bits[pointer] >>= 1;`);
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

function minifyOutput1(lines: string[]) {
  if (lines.length < 3) return lines;
  let output: string[] = [lines.shift()!];
  let linecount = lines.length;
  for (let i = 1; i < linecount + 1; i++) {
    let lastline = output[output.length - 1];
    let line = lines.shift();
    if (line == undefined) break;
    if (!line.length) continue;
    let type = getLineType(line);

    if (type && isLastLineSame(line, lastline)) {
      let indent = " ".repeat(getLineIndent(lastline));
      if (type == LastLineType.Shift) {
        let n = Number(parseLastLine(lastline, type));
        let m = Number(parseLastLine(line, type));
        output.pop();
        output.push(`${indent}bits[pointer] <<= ${n + m};`);
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
        throw new Error("not possible");
      }
    } else output.push(line);
  }
  return output;
}
function minifyOutput2(code: string) {
  return code.replace(
    /pointer \+= -\d+;/g,
    (m) => `pointer -= ${m.split("-")[1]}`,
  );
}
enum LastLineType {
  Shift = 1,
  Pointer,
  Output,
}

function getLineIndent(line: string) {
  for (let i = 0; i < line.length; i++) {
    if (/[^ ]/.test(line[i])) return i;
  }
  return 0;
}

function getLineType(line: string) {
  if (!line) return null;
  line = line.trim();
  return /^bits\[pointer\] <<= \d+;$/.test(line)
    ? LastLineType.Shift
    : /^pointer \+= -?\d+;$/.test(line)
      ? LastLineType.Pointer
      : /^output \+= _print\(\)(\.repeat\(\d+\))*;$/.test(line)
        ? LastLineType.Output
        : null;
}
function isLastLineSame(line: string, lastline: string): boolean {
  if (lastline && line) {
    if (getLineIndent(line) == getLineIndent(lastline)) {
      let type = [getLineType(line), getLineType(lastline)];
      if (type[0] && type[1]) {
        return type[0] == type[1];
      }
    }
  }
  return false;
}

function parseLastLine<T extends LastLineType>(line: string, type: T): string {
  line = line.trim();
  switch (type) {
    case LastLineType.Shift:
      //bits[pointer] <<= n;
      return line.split("<<= ")[1].slice(0, -1);
    case LastLineType.Pointer:
      //pointer += n;
      return line.split("+= ")[1].slice(0, -1);
    case LastLineType.Output:
      //output += _print().repeat(n);
      let l = line.split("+= ")[1].slice(0, -1);
      return l.includes(".") ? l.split("(")[2].slice(0, -1) : "1";
    default:
      return "";
  }
}
