# Leziscript (LZS)  
An Esolang that can be interpreted or transpiled to JavaScript code.  

---

## Disclaimer  
If you can't understand the documentation, figure it out by reading the source code. 🧐  

For a detailed **language breakdown and explanation**, refer to [`language-spec.md`](https://github.com/user-lezi/leziscript-esolang/blob/main/language-spec.md).  
Typedocs can be viewed at **[GitHub Pages](https://user-lezi.github.io/leziscript-esolang)**.

---

## Features  
- **Easy-to-use API**  
- **Simple syntax** (by Esolang standards)  
- **Interpretable or Transpilable** to JavaScript  

---

## Installation  
```bash
npm install lzscript
```

---

## Usage  

### Example 1: Running Leziscript in "transpile" mode  
```typescript
import run from 'lzscript';

const code = `[[]][??!][]:![[]]>[[]][][][[]][?!][].>[??]([?][[]][]>)[??]<[?]([][[]]).>[?][[]][][]..>[??][[]].[??!]<.[???!]>[?]([[]][])[?!][[]].>[??]([?][[]][]>)[??]<[??][[]].>![[]][][][[]][].>[?][[]][][].>[][[]][][].[?????]<.`;

const result = run(code, "transpile");

console.log("Transpiled Code:", result.outputCode);
console.log("Execution Time:", result.executionTime, "ms");
```

### Example 2: Running Leziscript in "interpreter" mode  
```typescript
import run from 'lzscript';

const code = `[[]][??!][]:![[]]>[[]][][][[]][?!][].>[??]([?][[]][]>)[??]<[?]([][[]]).>[?][[]][][]..>[??][[]].[??!]<.[???!]>[?]([[]][])[?!][[]].>[??]([?][[]][]>)[??]<[??][[]].>![[]][][][[]][].>[?][[]][][].>[][[]][][].[?????]<.`;

const result = run(code, "interpreter");

console.log("Output:", result.output);
console.log("Internal Pointer Position:", result.internal.pointer);
console.log("Internal Bit Array:", result.internal.bits);
```

---

## API Documentation  

### `run<T extends "transpile" | "interpreter">(code: string, mode: T, opts?: Partial<T extends "transpile" ? ITranspilerOptions : IInterpreterOptions>)`  

#### Parameters:  
- `code: string`: The Leziscript source code to be processed.  
- `mode: "transpile" | "interpreter"`:  
  - `"transpile"`: Transpiles Leziscript to JavaScript code.  
  - `"interpreter"`: Directly interprets and runs the Leziscript code.  
- `opts`: Optional configuration for the transpiler or interpreter.  

#### Returns:  
- If `mode` is `"transpile"`:  
  `{ outputCode: string; executionTime: number; }`  
  
- If `mode` is `"interpreter"`:  
  `{ internal: { pointer: number; bits: Int32Array<buffer>; }; output: string; executionTime: number; }`  

---

## Example: Hello World in Leziscript  
The following Leziscript code prints **"Hello World!"**:  

```
[[]][&!][]:![[]]>[[]][][][[]][?!][].>[&]([?][[]][]>)[&]<[?]([][[]]).>[?][[]][][]..>[&][[]].[&!]<.[&?!]>[?]([[]][])[?!][[]].>[&]([?][[]][]>)[&]<[&][[]].>![[]][][][[]][].>[?][[]][][].>[][[]][][].[&&?]<.
```

---

## Contributing  
Contributions are welcome! Feel free to open issues or submit pull requests.  

---

## License  
This project is licensed under the MIT License. See the `LICENSE` file for details.  
