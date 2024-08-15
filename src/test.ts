import { Tokenizer, Parser, Interpreter, Transpiler, Highlight } from ".";
import * as a from ".";

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
`;*/ "[[]][][][[]][][?][[]]:++:+-++-----+[???]-.";
let t: any, s: any;

//console.log(a);

console.log(Highlight(code));
//console.log(Tokenizer(code));
//console.log(Parser(code));
//console.log(Interpreter(code, { doNotLog: true }));
//console.log(Interpreter(code));
console.log((t = Transpiler(code, { minify: true })));
/*s = performance.now();
eval(t.code);
console.log("Took " + (performance.now() - s));
*/
