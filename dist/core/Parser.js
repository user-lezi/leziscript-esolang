"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = exports.DefaultParserOptions = exports.ParsedToken = exports.ParsedTokenType = void 0;
const Tokenizer_1 = require("./Tokenizer");
const util_1 = require("../util");
const path_1 = require("path");
const fs_1 = require("fs");
const ParserError = {
    Unknown: (tokenizer) => {
        let token = tokenizer.token();
        let line = tokenizer.locate();
        let slices = (0, util_1.sliceText)(line.line, token.index - line.fromIndex, token.index + token.token.length - line.fromIndex);
        return new SyntaxError(`Unable to parse code: Found Unknown Token Type.\n` +
            slices[0] +
            (0, util_1.boldText)((0, util_1.redText)(slices[1])) +
            slices[2] +
            "\n" +
            " ".repeat(token.index - line.fromIndex) +
            "^");
    },
    InvalidFile: (tokenizer) => {
        let token = tokenizer.token();
        let line = tokenizer.locate();
        let slices = (0, util_1.sliceText)(line.line, token.index - line.fromIndex, token.index + token.token.length - line.fromIndex);
        return new SyntaxError(`Unable to parse code: File Not Found.\n` +
            slices[0] +
            (0, util_1.boldText)((0, util_1.redText)(slices[1])) +
            slices[2] +
            "\n" +
            " ".repeat(token.index - line.fromIndex) +
            "^");
    },
    DisallowedToken: (tokenizer, ...expected) => {
        let token = tokenizer.token();
        let line = tokenizer.locate();
        let slices = (0, util_1.sliceText)(line.line, token.index - line.fromIndex, token.index + token.token.length - line.fromIndex);
        return new SyntaxError(`Unable to parse code: Disallowed Token Type.\n` +
            `Expected Type [${expected.join("], [")}], got (${token.type})\n` +
            slices[0] +
            (0, util_1.boldText)((0, util_1.redText)(slices[1])) +
            slices[2] +
            "\n" +
            " ".repeat(token.index - line.fromIndex) +
            "^");
    },
};
var ParsedTokenType;
(function (ParsedTokenType) {
    ParsedTokenType[ParsedTokenType["Loop"] = 0] = "Loop";
    ParsedTokenType[ParsedTokenType["Block"] = 1] = "Block";
    ParsedTokenType[ParsedTokenType["File"] = 2] = "File";
    ParsedTokenType[ParsedTokenType["Normal"] = 3] = "Normal";
})(ParsedTokenType || (exports.ParsedTokenType = ParsedTokenType = {}));
class ParsedToken {
    type;
    token;
    data = {};
    constructor(type, token) {
        this.type = type;
        this.token = token;
    }
    isLoop() {
        return this.type == ParsedTokenType.Loop;
    }
    isBlock() {
        return this.type == ParsedTokenType.Block;
    }
    isFile() {
        return this.type == ParsedTokenType.File;
    }
    isNormal() {
        return this.type == ParsedTokenType.Normal;
    }
    toString(indent = 2) {
        if (this.isFile()) {
            const fileToken = this;
            return `${fileToken.token.token}( ${fileToken.data.filename} )`;
        }
        if (this.isBlock()) {
            const blockToken = this;
            return `(\n${" ".repeat(indent)}${blockToken.data.code
                .map((token) => token.toString(indent * 2))
                .join("")
                .replace("\n", "\n" + " ".repeat(indent))}\n)`;
        }
        if (this.isLoop()) {
            const loopToken = this;
            return `${loopToken.token.token}${loopToken.data.code.toString(indent)}`;
        }
        return this.token.token;
    }
}
exports.ParsedToken = ParsedToken;
exports.DefaultParserOptions = {
    checkFiles: true,
};
class Parser {
    static LoopValues = {
        "?": 2,
        "!": 1,
    };
    static Parse(code, options) {
        return new this(Tokenizer_1.Tokenizer.Tokenize(code), options);
    }
    static ParseLoopCount(token) {
        if (token.startsWith("[") && token.endsWith("]")) {
            token = token.slice(1, -1);
        }
        return [...token].reduce((a, b) => a + this.LoopValues[b], 0);
    }
    #tokenizer;
    tokens = [];
    options;
    constructor(tokenizer, options = exports.DefaultParserOptions) {
        this.options = {
            ...exports.DefaultParserOptions,
            ...options,
        };
        this.#tokenizer = tokenizer;
        for (;;) {
            const token = tokenizer.token();
            if (!token)
                break;
            if (token.type !== Tokenizer_1.TokenType.Comment) {
                if (token.type === Tokenizer_1.TokenType.Unknown)
                    throw ParserError.Unknown(tokenizer);
                if (token.type === Tokenizer_1.TokenType.Looper) {
                    let parsedToken = new ParsedToken(ParsedTokenType.Loop, token);
                    let count = Parser.ParseLoopCount(token.token);
                    parsedToken.data.loopCount = count;
                    tokenizer.index++;
                    let toLoop = tokenizer.token();
                    if (toLoop) {
                        if (toLoop.type !== Tokenizer_1.TokenType.Comment) {
                            if (toLoop.type === Tokenizer_1.TokenType.Unknown)
                                throw ParserError.Unknown(tokenizer);
                            parsedToken.data.code = Parser.Parse(toLoop.token).tokens[0];
                            this.tokens.push(parsedToken);
                        }
                    }
                }
                if (token.type === Tokenizer_1.TokenType.Block) {
                    let parsedToken = new ParsedToken(ParsedTokenType.Block, token);
                    let code = token.token.slice(1, -1);
                    parsedToken.data.code = Parser.Parse(code).tokens;
                    this.tokens.push(parsedToken);
                }
                if (token.type === Tokenizer_1.TokenType.Reserved) {
                    let info = Tokenizer_1.Tokenizer.ReservedTokenInfo(token);
                    if (info.fileHead) {
                        let parsedToken = new ParsedToken(ParsedTokenType.File, token);
                        tokenizer.index++;
                        let fileNameToken = tokenizer.token();
                        if (fileNameToken) {
                            if (fileNameToken.type !== Tokenizer_1.TokenType.Comment) {
                                if (fileNameToken.type === Tokenizer_1.TokenType.Unknown)
                                    throw ParserError.Unknown(tokenizer);
                                if (fileNameToken.type !== Tokenizer_1.TokenType.Block)
                                    throw ParserError.DisallowedToken(tokenizer, ParsedTokenType.Block);
                                parsedToken.data.filename = fileNameToken.token.slice(1, -1);
                                if (this.options.checkFiles) {
                                    let filename = (0, util_1.resolveFileName)(parsedToken.data.filename);
                                    let ext = (0, path_1.extname)(filename);
                                    if (ext !== ".lzs")
                                        throw ParserError.InvalidFile(tokenizer);
                                    if (!(0, fs_1.existsSync)(filename))
                                        throw ParserError.InvalidFile(tokenizer);
                                }
                                this.tokens.push(parsedToken);
                            }
                        }
                    }
                    if (info[0] ||
                        info[1] ||
                        info.pointerNext ||
                        info.pointerPrevious ||
                        info.print ||
                        info.log ||
                        info.copy ||
                        info.delete) {
                        let parsedToken = new ParsedToken(ParsedTokenType.Normal, token);
                        parsedToken.data = info;
                        this.tokens.push(parsedToken);
                    }
                }
            }
            tokenizer.index++;
        }
    }
    get tokenizer() {
        return this.#tokenizer;
    }
    get size() {
        return this.tokens.length;
    }
    toString(indent = 2) {
        return this.tokens.map((token) => token.toString(indent)).join("");
    }
    code() {
        return this.#tokenizer.code;
    }
}
exports.Parser = Parser;
//# sourceMappingURL=Parser.js.map