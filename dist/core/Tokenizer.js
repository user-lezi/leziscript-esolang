"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tokenizer = exports.TokenType = void 0;
var TokenType;
(function (TokenType) {
    TokenType[TokenType["Unknown"] = 0] = "Unknown";
    TokenType[TokenType["Comment"] = 1] = "Comment";
    TokenType[TokenType["Looper"] = 2] = "Looper";
    TokenType[TokenType["Reserved"] = 3] = "Reserved";
    TokenType[TokenType["Block"] = 4] = "Block";
})(TokenType || (exports.TokenType = TokenType = {}));
class Tokenizer {
    tokens;
    code;
    static CommentChar = '"';
    static Reserved = "[[]] [] < > @ . # : !".split(" ");
    static ReservedTokenInfo(token) {
        const is = (s) => token.token === s;
        return {
            1: is("[[]]"),
            0: is("[]"),
            pointerNext: is(">"),
            pointerPrevious: is("<"),
            fileHead: is("@"),
            print: is("."),
            log: is("#"),
            copy: is(":"),
            delete: is("!"),
        };
    }
    static RawTokenize(code) {
        if (typeof code !== "string")
            throw new TypeError(`Expected code to be a string, got ${typeof code}`);
        if (code.length < 1)
            throw new TypeError(`Expected code to be a non-empty string.`);
        let commentChar = this.CommentChar;
        let inComment = false;
        let blockDepth = 0;
        let tokens = [];
        let currentToken = "";
        let depth = 0;
        for (let i = 0; i < code.length; i++) {
            let char = code[i];
            if (inComment) {
                currentToken += char;
                if (char == commentChar) {
                    inComment = false;
                    if (currentToken) {
                        tokens.push(currentToken);
                        currentToken = "";
                    }
                }
                continue;
            }
            if (char == commentChar) {
                if (currentToken) {
                    tokens.push(currentToken);
                    currentToken = "";
                }
                currentToken += char;
                inComment = true;
                continue;
            }
            let info = charInfo(char);
            if (info.blockOpen)
                blockDepth++;
            if (info.blockClose)
                blockDepth--;
            if (info.open)
                depth++;
            if (info.close)
                depth--;
            if (info.blockOpen && blockDepth == 1 && currentToken) {
                tokens.push(currentToken);
                currentToken = "";
            }
            if (info.open && depth == 1 && blockDepth == 0 && currentToken) {
                tokens.push(currentToken);
                currentToken = "";
            }
            currentToken += char;
            if (info.blockClose && blockDepth == 0) {
                tokens.push(currentToken);
                currentToken = "";
            }
            if (info.close && depth == 0 && blockDepth == 0) {
                tokens.push(currentToken);
                currentToken = "";
            }
        }
        if (inComment)
            throw new SyntaxError("Unterminated Comment");
        if (depth > 0)
            throw new SyntaxError(`Unclosed Brackets (${depth})\n> From: ${code.slice(code.lastIndexOf(currentToken))}`);
        if (blockDepth > 0)
            throw new SyntaxError(`Unclosed Block (${blockDepth})\n> From: ${code.slice(code.lastIndexOf(currentToken))}`);
        if (currentToken)
            tokens.push(currentToken);
        return tokens;
    }
    static Tokenize(code) {
        let rawTokens = this.RawTokenize(code);
        let tokens = [];
        let lastTokenIndex = -1;
        for (let i = 0; i < rawTokens.length; i++) {
            let raw = rawTokens[i].trim();
            if (!raw.length)
                continue;
            let subtokens;
            if ((raw[0] == "(" && raw.slice(-1) == ")") ||
                (raw[0] == "[" && raw.slice(-1) == "]") ||
                (raw[0] == this.CommentChar && raw.slice(-1) == this.CommentChar))
                subtokens = [raw];
            else
                subtokens = [...raw];
            for (let j = 0; j < subtokens.length; j++) {
                let subtoken = subtokens[j];
                let index = code.indexOf(subtoken, lastTokenIndex);
                lastTokenIndex = index;
                tokens.push({
                    token: subtoken,
                    index,
                    type: this.GetTokenType(subtoken),
                });
            }
        }
        return new this(tokens, code);
    }
    static GetTokenType(token) {
        if (token[0] == this.CommentChar && token.slice(-1) == this.CommentChar)
            return TokenType.Comment;
        if (token[0] == "(" && token.slice(-1) == ")")
            return TokenType.Block;
        if (token.length > 2 &&
            token[0] == "[" &&
            token.slice(-1) == "]" &&
            token.slice(1, -1).replace(/^[&?!]+$/, "").length == 0)
            return TokenType.Looper;
        if (this.Reserved.indexOf(token) > -1)
            return TokenType.Reserved;
        return TokenType.Unknown;
    }
    index = 0;
    codeLines = [];
    #codeLineIndexes = [];
    constructor(tokens, code) {
        this.tokens = tokens;
        this.code = code;
        let codeLines = this.code.split("\n");
        let lastLineIndex = -1;
        for (let i = 0; i < codeLines.length; i++) {
            const line = codeLines[i];
            let index = code.indexOf(line, lastLineIndex);
            lastLineIndex = index;
            this.codeLines.push({
                line,
                fromIndex: index,
            });
            this.#codeLineIndexes.push(index);
        }
    }
    get size() {
        return this.tokens.length;
    }
    getLine(index) {
        let lineIndex = this.#codeLineIndexes.length - 1;
        for (let i = 0; i < this.#codeLineIndexes.length; i++) {
            const j = this.codeLines[this.#codeLineIndexes.length - 1 - i];
            if (index >= j.fromIndex) {
                lineIndex = this.#codeLineIndexes.length - 1 - i;
                break;
            }
        }
        return this.codeLines[lineIndex];
    }
    token(index = this.index) {
        if (index < 0 || index >= this.tokens.length)
            return null;
        return this.tokens[index];
    }
    locate(token) {
        token ??= this.token();
        return this.getLine(token.index);
    }
}
exports.Tokenizer = Tokenizer;
function charInfo(char) {
    return {
        open: char === "[",
        close: char === "]",
        blockOpen: char === "(",
        blockClose: char === ")",
    };
}
//# sourceMappingURL=Tokenizer.js.map