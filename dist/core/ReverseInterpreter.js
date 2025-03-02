"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReverseInterpreter = exports.ReverseInterpretType = void 0;
const Parser_1 = require("./Parser");
const Tokenizer_1 = require("./Tokenizer");
var ReverseInterpretType;
(function (ReverseInterpretType) {
    ReverseInterpretType[ReverseInterpretType["CharacterByCharacter"] = 0] = "CharacterByCharacter";
    ReverseInterpretType[ReverseInterpretType["PreloadAndPrint"] = 1] = "PreloadAndPrint";
})(ReverseInterpretType || (exports.ReverseInterpretType = ReverseInterpretType = {}));
const _ReverseInterpreter = {
    [ReverseInterpretType.CharacterByCharacter]: function (text) {
        let code = "";
        for (let i = 0; i < text.length; i++) {
            const character = text[i];
            code += ReverseInterpreter.ConvertN(character.charCodeAt(0)) + ".>";
        }
        return code.slice(0, -1);
    },
    [ReverseInterpretType.PreloadAndPrint]: function (text) {
        let code = "";
        let preloadMap = new Map();
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
            let index = preloadMap.get(character);
            code +=
                "><"[current > index ? 1 : 0].repeat(Math.abs(current - index)) + ".";
            current = index;
        }
        return code;
    },
};
class ReverseInterpreter {
    static MinifyCode(code) {
        function getLoopCharacters(n) {
            if (n < 1)
                return "";
            let map = Object.entries(Parser_1.Parser.LoopValues).sort((a, b) => b[1] - a[1]);
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
        let tokenizer = Tokenizer_1.Tokenizer.Tokenize(code);
        let minified = "";
        let previousTokens = [tokenizer.tokens[0]];
        for (let i = 1; i < tokenizer.tokens.length; i++) {
            const token = tokenizer.tokens[i];
            let last = previousTokens[previousTokens.length - 1];
            if (last.type == token.type && last.token == token.token) {
                previousTokens.push(token);
            }
            else {
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
    static ConvertN(n) {
        return n.toString(2).replace(/[10]/g, (i) => (i == "1" ? "[[]]" : "[]"));
    }
    static ReverseInterpret(text, opts = {}) {
        let start = performance.now();
        if (typeof text !== "string")
            throw new TypeError(`Expected text to be a string, got ${typeof text}`);
        if (text.length < 1)
            throw new TypeError(`Expected text to be a non-empty string.`);
        opts = {
            type: opts.type ?? ReverseInterpretType.CharacterByCharacter,
            minify: Boolean(opts.minify),
        };
        let code = _ReverseInterpreter[opts.type](text);
        if (opts.minify)
            code = this.MinifyCode(code);
        return { code, options: opts, executionTime: performance.now() - start };
    }
}
exports.ReverseInterpreter = ReverseInterpreter;
//# sourceMappingURL=ReverseInterpreter.js.map