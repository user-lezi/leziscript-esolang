"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interpreter = Interpreter;
const Parser_1 = require("./Parser");
const Tokenizer_1 = require("./Tokenizer");
function Interpreter(code, opts = {}) {
    let start = performance.now();
    let { parsedTokens, code: _code } = (0, Parser_1.Parser)(code);
    let array = [""];
    let pointer = 0;
    let output = "";
    let logAll = parsedTokens[0].type == Tokenizer_1.TokenType.PrintAll
        ? (parsedTokens.shift(), true)
        : false;
    let runner = {
        [Tokenizer_1.TokenType.Value]: function (token) {
            array[pointer] += token.value == "[]" ? 0 : 1;
        },
        [Tokenizer_1.TokenType.Pointer]: function (token) {
            pointer += token.value == ">" ? 1 : -1;
            if (typeof array[pointer] !== "string")
                array[pointer] = "";
        },
        [Tokenizer_1.TokenType.Repeat]: function (token) {
            if (!(0, Parser_1.isRepeatToken)(token))
                throw new Error("This should not happen");
            let { repeated, count } = token;
            for (let i = 0; i < count; i++) {
                runner[repeated.type](repeated);
            }
        },
        [Tokenizer_1.TokenType.Print]: function (token) {
            output += String.fromCharCode(parseInt(array[pointer], 2));
        },
        [Tokenizer_1.TokenType.Delete]: function (token) {
            array[pointer] = array[pointer].slice(0, -1);
        },
        [Tokenizer_1.TokenType.CopyNext]: function (token) {
            array[pointer + 1] = array[pointer++];
        },
    };
    for (let token of parsedTokens) {
        runner[token.type](token);
    }
    if (logAll && opts.doNotLog == false) {
        console.log(String.fromCharCode(...array.map((x) => parseInt(x, 2))));
    }
    if (output && opts.doNotLog == false) {
        console.log(output);
    }
    return {
        array: array.map((x) => parseInt(x)),
        code: _code,
        output,
        logAll,
        executionTime: performance.now() - start,
        options: opts,
    };
}
//# sourceMappingURL=Interpreter.js.map