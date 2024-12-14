"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Compiler = exports.DefaultCompilerOption = void 0;
const fs_1 = require("fs");
const util_1 = require("../util");
const Parser_1 = require("./Parser");
const uglify_js_1 = require("uglify-js");
const CompileCodeFor = {
    Loop: function (count, iteratorKey, codeLines, indent) {
        let indentedLines = codeLines
            .filter((x) => x)
            .map((x) => " ".repeat(indent) + x)
            .join("\n");
        return `for(let ${iteratorKey} = 0; ${iteratorKey} < ${count}; ${iteratorKey}++) {\n${indentedLines}\n}`;
    },
};
exports.DefaultCompilerOption = {
    parser: Parser_1.DefaultParserOptions,
    codeIndent: 2,
    minify: false,
};
class Compiler {
    static Compile(code, options) {
        return new this(Parser_1.Parser.Parse(code, options?.parser), options);
    }
    #parser;
    #tokenizer;
    options;
    constructor(parser, options = exports.DefaultCompilerOption) {
        this.#parser = parser;
        this.#tokenizer = parser.tokenizer;
        this.options = { ...exports.DefaultCompilerOption, ...options };
    }
    get parser() {
        return this.#parser;
    }
    get tokenizer() {
        return this.#tokenizer;
    }
    get code() {
        return this.#parser.code();
    }
    async run() {
        let executionTimeStart = performance.now();
        let initialCode = `/* Initial Definations */\npointer = 0;\nbits = new Int32Array(3000);\noutput = "";\nfunction _print() {\n${" ".repeat(this.options.codeIndent)}return String.fromCharCode(bits[pointer])\n}\n`;
        let outputCodeLines = splitlines(initialCode);
        for (let i = 0; i < this.#parser.tokens.length; i++) {
            let compiled = compileToken(this.#parser.tokens[i], this);
            if (compiled.length)
                outputCodeLines.push(...compiled);
        }
        let outputCode = outputCodeLines.join("\n");
        if (this.options.minify) {
            outputCode = (0, uglify_js_1.minify)(outputCode, {
                toplevel: true,
                mangle: {
                    toplevel: true,
                    reserved: ["output"],
                },
                compress: {},
            }).code;
            outputCode += "return output;";
        }
        else
            outputCode += `\nreturn output;`;
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
exports.Compiler = Compiler;
function compileToken(token, compiler) {
    let output = [];
    if (token.isBlock()) {
        let subtokens = token.data.code;
        for (let i = 0; i < subtokens.length; i++) {
            output.push(...compileToken(subtokens[i], compiler));
        }
    }
    else if (token.isFile()) {
        let name = (0, util_1.resolveFileName)(token.data.filename);
        let contents = (0, fs_1.readFileSync)(name, "utf8");
        let subtokens = Parser_1.Parser.Parse(contents, compiler.parser.options).tokens;
        for (let i = 0; i < subtokens.length; i++) {
            output.push(...compileToken(subtokens[i], compiler));
        }
    }
    else if (token.isLoop()) {
        let codeLines = compileToken(token.data.code, compiler);
        let loopStatement = splitlines(CompileCodeFor.Loop(token.data.loopCount, "iterator_" + Math.floor(Math.random() * 1000), codeLines, compiler.options.codeIndent));
        output.push(...loopStatement);
    }
    else if (token.isNormal()) {
        let info = token.data;
        if (info.pointerNext || info.pointerPrevious) {
            output.push(`pointer += ${info.pointerNext ? 1 : -1};`);
        }
        else if (info.print) {
            output.push(`output += _print();`);
        }
        else if (info.log) {
            output.push(`console.log(_print());`);
        }
        else if (info[0] || info[1]) {
            output.push(`bits[pointer] <<= 1;`);
            if (info[1])
                output.push(`bits[pointer]++;`);
        }
    }
    return output;
}
function splitlines(str) {
    return str.split("\n");
}
//# sourceMappingURL=Compiler.js.map