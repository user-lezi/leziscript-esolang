"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
let code = "[[]][][][[]][][][].>[[]][[]][][[]][][][[]].";
let t, s;
console.log((t = (0, _1.Transpiler)(code)));
s = performance.now();
eval(t.code);
console.log("Took " + (performance.now() - s));
//# sourceMappingURL=test.js.map