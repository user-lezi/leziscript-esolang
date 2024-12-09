"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.format = format;
exports.boldText = boldText;
exports.redText = redText;
exports.sliceText = sliceText;
function format(text, code) {
    return `\x1b[${code}m${text}\x1b[0m`;
}
function boldText(text) {
    return format(text, 1);
}
function redText(text) {
    return format(text, 31);
}
function sliceText(text, startIndex, endIndex) {
    return [
        text.slice(0, startIndex),
        text.slice(startIndex, endIndex),
        text.slice(endIndex),
    ];
}
//# sourceMappingURL=util.js.map