"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.format = format;
exports.boldText = boldText;
exports.redText = redText;
exports.sliceText = sliceText;
exports.resolveFileName = resolveFileName;
const path_1 = require("path");
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
function resolveFileName(filename) {
    if (filename.startsWith("#"))
        filename = (0, path_1.join)(process.cwd(), filename.slice(1));
    return filename;
}
//# sourceMappingURL=util.js.map