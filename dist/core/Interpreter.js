"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interpreter = exports.DefaultInterpreterOption = void 0;
const fs_1 = require("fs");
const util_1 = require("../util");
const Parser_1 = require("./Parser");
exports.DefaultInterpreterOption = {
    doNotLog: false,
    parser: Parser_1.DefaultParserOptions,
};
class Interpreter {
    options;
    static Interpret(code, options) {
        return new this(Parser_1.Parser.Parse(code, options?.parser), options);
    }
    #parser;
    #tokenizer;
    constructor(parser, options = exports.DefaultInterpreterOption) {
        this.options = options;
        this.#parser = parser;
        this.#tokenizer = parser.tokenizer;
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
    run() {
        let executionTimeStart = performance.now();
        let internal = {
            pointer: 0,
            bits: new Int32Array(3000),
            print: function print() {
                return String.fromCharCode(this.bits[this.pointer]);
            },
        };
        let output = "";
        let queue = [];
        queue.push(this.#parser.tokens.shift());
        while (queue.length > 0) {
            let token = queue.shift();
            if (token) {
                if (token.isBlock()) {
                    queue.unshift(...token.data.code);
                }
                else {
                    if (token.isFile()) {
                        let name = (0, util_1.resolveFileName)(token.data.filename);
                        let contents = (0, fs_1.readFileSync)(name, "utf8");
                        let parsedTokens = Parser_1.Parser.Parse(contents, this.options.parser).tokens;
                        queue.unshift(...parsedTokens);
                    }
                    else if (token.isLoop()) {
                        let count = token.data.loopCount;
                        for (let i = 0; i < count; i++) {
                            queue.unshift(token.data.code);
                        }
                    }
                    else if (token.isNormal()) {
                        let info = token.data;
                        if (info.pointerNext || info.pointerPrevious) {
                            internal.pointer += info.pointerNext ? 1 : -1;
                        }
                        else if (info.print) {
                            output += internal.print();
                        }
                        else if (info.log && !this.options.doNotLog) {
                            console.log(internal.print());
                        }
                        else if (info.copy) {
                            internal.bits[internal.pointer + 1] =
                                internal.bits[internal.pointer];
                            internal.pointer++;
                        }
                        else if (info.delete) {
                            internal.bits[internal.pointer] >>= 1;
                        }
                        else if (info[0] || info[1]) {
                            internal.bits[internal.pointer] <<= 1;
                            if (info[1])
                                internal.bits[internal.pointer] += 1;
                        }
                    }
                }
                if (queue.length == 0 && this.#parser.tokens.length > 0)
                    queue.push(this.#parser.tokens.shift());
            }
        }
        return {
            internal,
            output,
            executionTime: performance.now() - executionTimeStart,
        };
    }
}
exports.Interpreter = Interpreter;
//# sourceMappingURL=Interpreter.js.map