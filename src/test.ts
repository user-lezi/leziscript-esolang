import {
  Tokenizer,
  Parser,
  Interpreter,
  Transpiler,
  Highlight,
  InterpretFiles,
  TranspileFiles,
} from ".";
import * as a from ".";
import { readFileSync } from "fs";

/*
H: 1001000
e: 1100101
l: 1101100
l: 1101100
o: 1101111
 : 100000
W: 1010111
o: 1101111
r: 1110010
l: 1101100
d: 1100100
!: 100001
*/
let code =
  /* `
[[]][?][][[]][!?][].:[???]![[]][?][][[]][][[]].:[??]![?][[]][?][]..[??]![??][[]].>[[]][??!][].>[[]][][[]][][!?][[]].<<.>>>[!?][[]][?][][[]][].[??!]![][?][[]][?][].[??]![][[]][?][].>[[]][??][][[]].
`;*/ //"[[]][][][[]][][?][[]]:++:+-++-----+[???]-.";
  readFileSync("test_scripts/test_1.lzs", "utf8");
let t: any, s: any;

//console.log(a);
//console.log(code);
//console.log(Highlight(code));
//console.log(Tokenizer(code));
//console.log(Parser(code));
//console.log(Interpreter(code, { doNotLog: true }));
//console.log(Interpreter(code));
//console.log((t = Transpiler(code, { minify: true })));
/*s = performance.now();
eval(t.code);
console.log("Took " + (performance.now() - s));
*/
/*
console.log(
  InterpretFiles("test_scripts/test_1.lzs", {
    doNotLog: true,
  }),
);
*/
console.log(
  TranspileFiles("test_scripts/test_1.lzs", {
    minify: true,
  }),
);
