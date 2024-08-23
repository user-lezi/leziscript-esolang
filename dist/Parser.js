"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanCode = cleanCode;
exports.parseRepeatCount = parseRepeatCount;
exports.isRepeatToken = isRepeatToken;
exports.insertFiles = insertFiles;
exports.Parser = Parser;
const Tokenizer_1 = require("./Tokenizer");
const fs_1 = require("fs");
const path_1 = require("path");
function cleanCode(code) {
    if (typeof code !== "string")
        throw new TypeError("Expected code to be a string, got " + typeof code);
    return code.replace(/'[^']*'/g, "").replace(/[^\[\]><.!?&:+\-$]+/g, "");
}
function parseRepeatCount(token) {
    return [...token.slice(1, -1)].reduce((a, b) => a + (b == "&" ? 12 : b == "?" ? 2 : 1), 0);
}
function isRepeatToken(token) {
    return token.type == Tokenizer_1.TokenType.Repeat;
}
function insertFiles(code, root = ".") {
    if (!code.includes("@"))
        return code;
    let regex = /@\(#?[^)]+\)/g;
    let newCode = code.replace(regex, function (match) {
        let fileName = match.slice(2, -1);
        if (fileName.startsWith("#")) {
            fileName = fileName.slice(1);
            fileName = (0, path_1.join)(root, fileName);
        }
        let filePath = fileName.replace(".lzs", "") + ".lzs";
        if (!(0, fs_1.existsSync)(filePath)) {
            throw new Error(`File ${fileName} [${filePath}] does not exist!`);
        }
        root = (0, path_1.dirname)(fileName);
        let contents = (0, fs_1.readFileSync)(filePath, "utf8");
        contents = insertFiles(contents, root);
        return " " + contents + " ";
    });
    return newCode;
}
function Parser(rawCode, root = ".") {
    let code = insertFiles(rawCode, root);
    code = cleanCode(code);
    let tokens = (0, Tokenizer_1.Tokenizer)(code);
    let parsedTokens = [];
    let inRepeat = false;
    let canBeRepeated = [
        Tokenizer_1.TokenType.Value,
        Tokenizer_1.TokenType.Pointer,
        Tokenizer_1.TokenType.Print,
        Tokenizer_1.TokenType.Delete,
        Tokenizer_1.TokenType.Increament,
        Tokenizer_1.TokenType.Decreament,
    ];
    for (let token of tokens) {
        if (inRepeat && !canBeRepeated.includes(token.type))
            throw new SyntaxError(`This token cannot be repeated: ${token.value}`);
        if (token.type == Tokenizer_1.TokenType.PrintAll) {
            if (tokens.indexOf(token) == 0) {
                parsedTokens.push(token);
                continue;
            }
            else {
                throw new SyntaxError(`PrintAll must be the first token`);
            }
        }
        if (token.type == Tokenizer_1.TokenType.Repeat) {
            inRepeat = true;
            parsedTokens.push({
                value: token.value,
                type: Tokenizer_1.TokenType.Repeat,
                repeated: {},
                count: parseRepeatCount(token.value),
            });
        }
        else {
            if (inRepeat) {
                parsedTokens[parsedTokens.length - 1].repeated =
                    token;
                inRepeat = false;
            }
            else {
                parsedTokens.push(token);
            }
        }
    }
    return {
        tokens,
        rawCode,
        code,
        parsedTokens,
    };
}
//# sourceMappingURL=Parser.js.map