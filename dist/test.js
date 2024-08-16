"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const fs_1 = require("fs");
let code = (0, fs_1.readFileSync)("test_scripts/test_1.lzs", "utf8");
let t, s;
console.log((0, _1.TranspileFiles)("test_scripts/test_1.lzs", {
    minify: true,
}));
//# sourceMappingURL=test.js.map