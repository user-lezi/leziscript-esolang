"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
let code = "[[]][][][[]][][?][[]]:++:+-++-----+[???]-.";
let t, s;
console.log((0, _1.Highlight)(code));
console.log((t = (0, _1.Transpiler)(code, { minify: true })));
//# sourceMappingURL=test.js.map