import { Parser, IParsed, isRepeatToken } from "./Parser";
import { TokenType } from "./Tokenizer";

export interface IInterpreterOptions {
  doNotLog: boolean;
}

export function Interpreter(
  code: string,
  opts: Partial<IInterpreterOptions> = {},
) {
  let start = performance.now();
  let { parsedTokens, code: _code } = Parser(code);

  let array: string[] = [""];
  let pointer = 0;
  let output = "";
  let logAll =
    parsedTokens[0].type == TokenType.PrintAll
      ? (parsedTokens.shift(), true)
      : false;

  let runner = {
    [TokenType.Value]: function (token) {
      array[pointer] += token.value == "[]" ? 0 : 1;
    },
    [TokenType.Pointer]: function (token) {
      pointer += token.value == ">" ? 1 : -1;
      if (typeof array[pointer] !== "string") array[pointer] = "";
    },
    [TokenType.Repeat]: function (token) {
      if (!isRepeatToken(token)) throw new Error("This should not happen");
      let { repeated, count } = token;
      for (let i = 0; i < count; i++) {
        runner[repeated.type](repeated);
      }
    },
    [TokenType.Print]: function (token) {
      output += String.fromCharCode(parseInt(array[pointer], 2));
    },
    [TokenType.Delete]: function (token) {
      array[pointer] = array[pointer].slice(0, -1);
    },
    [TokenType.CopyNext]: function (token) {
      array[pointer + 1] = array[pointer++];
    },
    [TokenType.Increament]: function (token) {
      array[pointer] = (parseInt(array[pointer] ?? "0", 2) + 1).toString(2);
    },
    [TokenType.Decreament]: function (token) {
      array[pointer] = (parseInt(array[pointer] ?? "0", 2) - 1).toString(2);
    },
  } as Record<TokenType, (token: IParsed) => unknown>;

  for (let token of parsedTokens) {
    runner[token.type](token);
  }

  if (logAll && opts.doNotLog == false) {
    console.log(String.fromCharCode(...array.map((x) => parseInt(x, 2))));
  }
  if (output && opts.doNotLog == false) {
    console.log(output);
  }

  return {
    array: array.map((x) => parseInt(x)),
    code: _code,
    output,
    logAll,
    executionTime: performance.now() - start,
    options: opts,
  };
}
