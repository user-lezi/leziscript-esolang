# Leziscript (LZS)
An Esolang that can be Interpreted or Transpile to javascript code.
> If you can't understand the documentation then figure it out on your own by reading the src code.

## Example Code
Here's a code to print "Hello World!"
```ts
[[]][?][][[]][!?][].:[???]![[]][?][][[]][][[]].:[??]![?][[]][?][]..[??]![??][[]].>[[]][??!][].>[[]][][[]][][!?][[]].<<.>>>[!?][[]][?][][[]][].[??!]![][?][[]][?][].[??]![][[]][?][].>[[]][??][][[]].
```

## Working Principle
- Similar to brainfck
- Binary form of ascii characters.
  - `[]` is `0` and `[[]]` is `1`
  - Therefore, `[[]][][[]][[]]` is `1011`
  - Similarly, `H` is `1001000` which is `[[]][][][[]][][][]`
- Switch/Change pointer using `>` or `<`
- Print the current character (the pointer positioned index) using `.`

Here is example for "Hi"
```ts
[[]][][][[]][][][].>[[]][[]][][[]][][][[]].
```

## API
Here is the snippet to know how to use leziscript in node.js.
```ts
import { Interpreter, Transpiler } from "lzscript";
let code = "[[]][][][[]][][][].>[[]][[]][][[]][][][[]].";
console.log(Interpreter(code));
/*
{
  code: "[[]][][][[]][][][].>[[]][[]][][[]][][][[]].",
  options: {},
  output: "Hi",
  executionTime: 0.69,
  array: [1001000, 1101001]
}
*/

console.log(Transpiler(code))
/*
{
  code: 'let pointer = 0;\n' +
        'let array = [""];\n' +
        'let output = [];\n' +
        'array[pointer] += "1001000";\n' +
        'output.push(parseInt(array[pointer], 2));\n' +
        'pointer += 1;\n' +
        'if(array[pointer] === undefined) array[pointer] = "";\n' +
        'array[pointer] += "1101001";\n' +
        'output.push(parseInt(array[pointer], 2));\n' +
        'if(output.length) console.log(String.fromCharCode(...output));',
  options: {},
  executionTime: 0.69
}
*/
```

### Interpreter Options
| Name | Type | Description |
| - | - | - |
| doNotLog | `boolean` | Forcefully blocks `.` to print the output (default: `false`) |

### Transpiler Options
| Name | Type | Description |
| - | - | - |
| minify | `boolean` | Minifies the output (default: `false`) |
| beautify | `boolean` | Beatify the output (default: `false`) |
## Advanced
### Loops
Shorten your code using loops 🤓 ☝️

- The loop can do `m` for `n` number of times.
- Eg. `[??!][[]]`
  -  here `n` is the value inside the first angled brackets (ie. `??!`)
  -  here `m` is the value after the first angled brackets (ie. `[[]]`)
- `n` value is a string of `?` or `!`
  - To parse `n`, `?` is valued as `2` and `!` as `1`.
  - Eg. `??!` becomes `2 + 2 + 1`, which is `5`
- Now, basically `m` will happen `n` times.
  - So `[??!][[]]` becomes to `[[]]` repeats `5`
  - Resulting in `[[]][[]][[]][[]][[]]`.
  - Outputing as `11111`

### Print All
Print all the values at once instead of print one by one.
- values gets printed when the code execution is over.
- Use **Print All** by prefixing the code with `$`
- Eg. `$[???][[]]`

### Delete
Deletes a bit.
- Using `!`
- Eg. `[[]][][[]]![][[]]` is same as `[[]][][][[]]`
  - *`101!01` is same as `1001`*

### Copy and next
Copies the value and sets it to the next pointer.
- Using `:`
- Eg. `[[]][]:[]` is same as `[[]][]>[[]][][]`


> Created by **leziuwu** on discord