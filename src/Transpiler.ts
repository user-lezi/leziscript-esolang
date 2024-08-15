// @ts-ignore
import { minify } from "uglify-js";
// @ts-ignore
import { js } from "js-beautify/js";
import { Parser, IParsed, isRepeatToken } from "./Parser";
import { TokenType } from "./Tokenizer";

export interface ITranspilerOptions {
  minify: boolean;
  beautify: boolean;
}

export function Transpiler(
  code: string,
  opts: Partial<ITranspilerOptions> = {},
) {
  let start = performance.now();
  let transpiled = [
    `let pointer = 0;`,
    `let array = [""];`,
    `let output = [];`,
  ];

  let { parsedTokens } = Parser(code);
  let logAll =
    parsedTokens[0].type == TokenType.PrintAll
      ? (parsedTokens.shift(), true)
      : false;
  let runner = {
    [TokenType.Value]: function (token) {
      if (transpiled[transpiled.length - 1].startsWith("array[pointer] += ")) {
        transpiled[transpiled.length - 1] = transpiled[
          transpiled.length - 1
        ].includes('"')
          ? transpiled[transpiled.length - 1].slice(0, -2) +
            (token!.value == "[]" ? 0 : 1) +
            '";'
          : transpiled[transpiled.length - 1].replace(
              /[01]/,
              (m: string) => `"${m}${token!.value == "[]" ? 0 : 1}"`,
            );
      } else
        transpiled.push(`array[pointer] += ${token!.value == "[]" ? 0 : 1};`);
    },
    [TokenType.Pointer]: function (token) {
      let s = transpiled[transpiled.length - 2];
      if (s.startsWith("pointer += ")) {
        transpiled[transpiled.length - 2] = s.replace(
          /-?\d+/,
          (m: string) => Number(m) + (token!.value == ">" ? 1 : -1) + "",
        );
      } else
        transpiled.push(
          `pointer += ${token!.value == ">" ? 1 : -1};`,
          `if(array[pointer] === undefined) array[pointer] = "";`,
        );
    },
    [TokenType.Repeat]: function (token) {
      if (!isRepeatToken(token!)) throw new Error("This should not happen");
      let { repeated, count } = token;
      let randomIterator = "_" + Math.floor(Math.random() * 500).toString(36);
      transpiled.push(
        `for (let ${randomIterator} = 0; ${randomIterator} < ${count}; ${randomIterator}++) {`,
      );
      runner[repeated.type](repeated);
      transpiled.push(`}`);
    },
    [TokenType.Print]: function () {
      let l = transpiled[transpiled.length - 1];
      if (l.startsWith("output.push(")) {
        if (l.endsWith("2));")) {
          transpiled[transpiled.length - 1] =
            `output.push(...Array(2).fill(parseInt(array[pointer], 2)));`;
        } else {
          transpiled[transpiled.length - 1] = transpiled[
            transpiled.length - 1
          ].replace(
            /\(\d+\)/,
            (m: string) => `(${parseInt(m.slice(1, -1)) + 1})`,
          );
        }
      } else transpiled.push(`output.push(parseInt(array[pointer], 2));`);
    },
    [TokenType.Delete]: function () {
      transpiled.push(`array[pointer] = array[pointer].slice(0, -1);`);
    },
    [TokenType.CopyNext]: function () {
      transpiled.push(`array[pointer + 1] = array[pointer++];`);
    },
    [TokenType.Increament]: function () {
      let regex = /^array\[pointer\]\ = \(parseInt/;
      if (regex.test(transpiled[transpiled.length - 1])) {
        transpiled[transpiled.length - 1] = transpiled[
          transpiled.length - 1
        ].replace(/[\-+] \d+/g, (m: string) => {
          let sign = m.startsWith("+") ? 1 : -1;
          let num = Number(m.slice(2)) * sign;
          let newnum = num + 1;
          let newsign = newnum < 0 ? "-" : "+";
          return `${newsign} ${Math.abs(newnum)}`;
        });
      } else {
        transpiled.push(
          `array[pointer] = (parseInt(array[pointer] ?? "0", 2) + 1).toString(2);`,
        );
      }
    },
    [TokenType.Decreament]: function () {
      let regex = /^array\[pointer\]\ = \(parseInt/;
      if (regex.test(transpiled[transpiled.length - 1])) {
        transpiled[transpiled.length - 1] = transpiled[
          transpiled.length - 1
        ].replace(/[\-+] \d+/g, (m: string) => {
          let sign = m.startsWith("+") ? 1 : -1;
          let num = Number(m.slice(2)) * sign;
          let newnum = num - 1;
          let newsign = newnum < 0 ? "-" : "+";
          return `${newsign} ${Math.abs(newnum)}`;
        });
      } else {
        transpiled.push(
          `array[pointer] = (parseInt(array[pointer] ?? "0", 2) - 1).toString(2);`,
        );
      }
    },
  } as Record<TokenType, (token?: IParsed) => unknown>;

  for (let token of parsedTokens) {
    runner[token.type](token);
  }

  transpiled.push(
    `if(output.length) console.log(String.fromCharCode(...output));`,
  );

  if (logAll) {
    transpiled.push(
      `console.log(String.fromCharCode(...array.map((x) => parseInt(x, 2))));`,
    );
  }

  let transpiledCode = transpiled.join("\n");

  if (opts.minify == true)
    transpiledCode = minify(transpiledCode, {
      toplevel: true,
    }).code;
  if (opts.beautify == true)
    transpiledCode = js.beautify(transpiledCode, {
      indent_size: 2,
    });

  return {
    code: transpiledCode,
    options: opts,
    executionTime: performance.now() - start,
  };
}
