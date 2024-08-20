"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncodeStyle = void 0;
exports.Encoder = Encoder;
exports.EncodeInAllStyles = EncodeInAllStyles;
const Tokenizer_1 = require("./Tokenizer");
var EncodeStyle;
(function (EncodeStyle) {
    EncodeStyle[EncodeStyle["Normal"] = 0] = "Normal";
    EncodeStyle[EncodeStyle["Printer"] = 1] = "Printer";
    EncodeStyle[EncodeStyle["OneSlot"] = 2] = "OneSlot";
})(EncodeStyle || (exports.EncodeStyle = EncodeStyle = {}));
function Encoder(str, style = EncodeStyle.Normal) {
    let start = performance.now();
    if (typeof str !== "string") {
        throw new TypeError("Expected a string");
    }
    if (str.length < 1) {
        throw new TypeError("Expected a non-empty string");
    }
    let values = [...str].map((char) => char.charCodeAt(0));
    let result;
    switch (style) {
        case EncodeStyle.Normal:
            result = __EncodeNormal(values);
            break;
        case EncodeStyle.Printer:
            result = __EncodePrinter(values);
            break;
        case EncodeStyle.OneSlot:
            result = __EncodeOneSlot(values);
            break;
        default:
            throw new Error("Invalid EncodeStyle");
    }
    return {
        values,
        input: str,
        style,
        output: useRepeats(result),
        executionTime: performance.now() - start,
    };
}
function EncodeInAllStyles(str) {
    let styles = [EncodeStyle.Normal, EncodeStyle.Printer, EncodeStyle.OneSlot];
    let results = [];
    for (let style of styles) {
        let result = Encoder(str, style);
        results.push({
            style: EncodeStyle[style],
            size: result.output.length,
            code: result.output,
            executionTime: result.executionTime,
        });
    }
    return results.sort((a, b) => a.size - b.size);
}
function enn(n) {
    return en(n.toString(2));
}
function en(str) {
    return /^[01]+$/g.test(str)
        ? str.replaceAll("1", "[[]]").replaceAll("0", "[]")
        : "";
}
function repeatN(n) {
    let a = Math.floor(n / 2);
    let b = n % 2;
    return (a > 0 ? "?".repeat(a) : "") + (b > 0 ? "!" : "");
}
function useRepeats(code) {
    let tokens = (0, Tokenizer_1.Tokenizer)(code);
    let results = [];
    let previous = [];
    for (let token of tokens) {
        if (!previous.length) {
            previous.push(token);
        }
        else {
            let last = previous[previous.length - 1];
            if (last.type == token.type && last.value == token.value) {
                previous.push(token);
            }
            else {
                let n = previous.length;
                let repeat = repeatN(n);
                let code1 = `[${repeat}]${last.value}`;
                let code2 = previous.map((x) => x.value).join("");
                let better = code1.length <= code2.length ? code1 : code2;
                results.push(better);
                previous = [token];
            }
        }
    }
    if (previous.length) {
        let last = previous[previous.length - 1];
        let n = previous.length;
        let repeat = repeatN(n);
        let code1 = `[${repeat}]${last.value}`;
        let code2 = previous.map((x) => x.value).join("");
        let better = code1.length <= code2.length ? code1 : code2;
        results.push(better);
    }
    return results.join("");
}
function __EncodeNormal(values) {
    let result = [];
    for (let i = 0; i < values.length; i++) {
        result.push(enn(values[i]));
    }
    return result.join(".>") + ".";
}
function __EncodePrinter(values) {
    let vs = {};
    let result = [];
    let j = -1;
    for (let i = values.length - 1; i >= 0; i--) {
        let value = values[i];
        if (vs.hasOwnProperty(value))
            continue;
        vs[value] = ++j;
        result.push(enn(value));
    }
    let pointers = "";
    for (let value of values) {
        let index = vs[value];
        pointers +=
            (j == index ? "" : (index < j ? "<" : ">").repeat(Math.abs(index - j))) +
                ".";
        j = index;
    }
    return result.join(">") + pointers;
}
function __EncodeOneSlot(values) {
    let results = [];
    let last = -1;
    for (let value of values) {
        results.push(last == -1
            ? enn(value)
            : value == last
                ? ""
                : (value < last ? "-" : "+").repeat(Math.abs(value - last)));
        last = value;
    }
    return results.join(".") + ".";
}
//# sourceMappingURL=Encoder.js.map