"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const fs_1 = require("fs");
let code = (0, fs_1.readFileSync)("test_scripts/test_1.lzs", "utf8");
let t, s;
let str = "Lzscript, An Esolang that can be Interpreted or Transpile to javascript code.";
console.log((t = (0, _1.EncodeInAllStyles)(str)));
console.log(t.map((x) => (0, _1.Interpreter)(x.code, { doNotLog: true })));
//# sourceMappingURL=test.js.map