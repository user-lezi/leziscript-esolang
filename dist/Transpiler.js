"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transpiler = Transpiler;
const uglify_js_1 = require("uglify-js");
const js_1 = require("js-beautify/js");
const Parser_1 = require("./Parser");
const Tokenizer_1 = require("./Tokenizer");
function Transpiler(code, opts = {}) {
    let start = performance.now();
    let transpiled = [
        `let pointer = 0;`,
        `let array = [""];`,
        `let output = [];`,
    ];
    let { parsedTokens } = (0, Parser_1.Parser)(code);
    let logAll = parsedTokens[0].type == Tokenizer_1.TokenType.PrintAll
        ? (parsedTokens.shift(), true)
        : false;
    let runner = {
        [Tokenizer_1.TokenType.Value]: function (token) {
            if (transpiled[transpiled.length - 1].startsWith("array[pointer] += ")) {
                transpiled[transpiled.length - 1] = transpiled[transpiled.length - 1].includes('"')
                    ? transpiled[transpiled.length - 1].slice(0, -2) +
                        (token.value == "[]" ? 0 : 1) +
                        '";'
                    : transpiled[transpiled.length - 1].replace(/[01]/, (m) => `"${m}${token.value == "[]" ? 0 : 1}"`);
            }
            else
                transpiled.push(`array[pointer] += ${token.value == "[]" ? 0 : 1};`);
        },
        [Tokenizer_1.TokenType.Pointer]: function (token) {
            let s = transpiled[transpiled.length - 2];
            if (s.startsWith("pointer += ")) {
                transpiled[transpiled.length - 2] = s.replace(/-?\d+/, (m) => Number(m) + (token.value == ">" ? 1 : -1) + "");
            }
            else
                transpiled.push(`pointer += ${token.value == ">" ? 1 : -1};`, `if(array[pointer] === undefined) array[pointer] = "";`);
        },
        [Tokenizer_1.TokenType.Repeat]: function (token) {
            if (!(0, Parser_1.isRepeatToken)(token))
                throw new Error("This should not happen");
            let { repeated, count } = token;
            let randomIterator = "_" + Math.floor(Math.random() * 500).toString(36);
            transpiled.push(`for (let ${randomIterator} = 0; ${randomIterator} < ${count}; ${randomIterator}++) {`);
            runner[repeated.type](repeated);
            transpiled.push(`}`);
        },
        [Tokenizer_1.TokenType.Print]: function () {
            let l = transpiled[transpiled.length - 1];
            if (l.startsWith("output.push(")) {
                if (l.endsWith("2));")) {
                    transpiled[transpiled.length - 1] =
                        `output.push(...Array(2).fill(parseInt(array[pointer], 2)));`;
                }
                else {
                    transpiled[transpiled.length - 1] = transpiled[transpiled.length - 1].replace(/\(\d+\)/, (m) => `(${parseInt(m.slice(1, -1)) + 1})`);
                }
            }
            else
                transpiled.push(`output.push(parseInt(array[pointer], 2));`);
        },
        [Tokenizer_1.TokenType.Delete]: function () {
            transpiled.push(`array[pointer] = array[pointer].slice(0, -1);`);
        },
        [Tokenizer_1.TokenType.CopyNext]: function () {
            transpiled.push(`array[pointer + 1] = array[pointer++];`);
        },
    };
    for (let token of parsedTokens) {
        runner[token.type](token);
    }
    transpiled.push(`if(output.length) console.log(String.fromCharCode(...output));`);
    if (logAll) {
        transpiled.push(`console.log(String.fromCharCode(...array.map((x) => parseInt(x, 2))));`);
    }
    let transpiledCode = transpiled.join("\n");
    if (opts.minify == true)
        transpiledCode = (0, uglify_js_1.minify)(transpiledCode, {
            toplevel: true,
        }).code;
    if (opts.beautify == true)
        transpiledCode = js_1.js.beautify(transpiledCode, {
            indent_size: 2,
        });
    return {
        code: transpiledCode,
        options: opts,
        executionTime: performance.now() - start,
    };
}
//# sourceMappingURL=Transpiler.js.map