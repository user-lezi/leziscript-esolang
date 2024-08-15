"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenHighlight = void 0;
exports.RawHighlight = RawHighlight;
exports.Highlight = Highlight;
exports.parseHighlighted = parseHighlighted;
const Parser_1 = require("./Parser");
const Tokenizer_1 = require("./Tokenizer");
exports.TokenHighlight = {
    Unknown: {
        int: -1,
        code: "\x1b[0m",
    },
    Value: parse(0xffae00),
    Pointer: parse(0xf0d1ff),
    Repeat: parse(0x94d6ff),
    Repeated: parse(0x4dbbff),
    Print: parse(0xccffcc),
    PrintAll: parse(0x009900),
    Delete: parse(0xff4d4d),
    CopyNext: parse(0xf2ff66),
};
function parse(int) {
    let red = int >> 16;
    let green = (int >> 8) & 255;
    let blue = int & 255;
    return {
        int,
        code: `\x1b[38;2;${red};${green};${blue}m`,
    };
}
function RawHighlight(code) {
    let tokens = (0, Parser_1.Parser)(code).parsedTokens;
    let output = [];
    for (let token of tokens) {
        if ((0, Parser_1.isRepeatToken)(token)) {
            output.push({
                color: exports.TokenHighlight.Repeat,
                value: token.value,
                bold: false,
            });
            output.push({
                color: exports.TokenHighlight.Repeated,
                value: token.repeated.value,
                bold: true,
            });
        }
        else {
            let color = exports.TokenHighlight[Tokenizer_1.TokenType[token.type]] ?? exports.TokenHighlight.Unknown;
            output.push({
                color,
                value: token.value,
                bold: false,
            });
        }
    }
    return output;
}
function Highlight(code) {
    return parseHighlighted(RawHighlight(code));
}
function parseHighlighted(tokens) {
    let output = "";
    for (let token of tokens) {
        output +=
            (token.bold ? "\x1b[1m" : "") +
                token.color.code +
                token.value +
                "\x1b[0m";
    }
    return output;
}
//# sourceMappingURL=Highlight.js.map