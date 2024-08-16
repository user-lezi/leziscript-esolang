import { TokenType, IToken, Tokenizer } from "./Tokenizer";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";

export function cleanCode(code: string) {
  if (typeof code !== "string")
    throw new TypeError("Expected code to be a string, got " + typeof code);
  /* Comments / Unwanted Characters */
  return code.replace(/'[^']*'/g, "").replace(/[^\[\]><.!?:+\-$]+/g, "");
}

export function parseRepeatCount(token: string) {
  return [...token.slice(1, -1)].reduce((a, b) => a + (b == "?" ? 2 : 1), 0);
}

export type IParsed<T = false> = IToken &
  (T extends true
    ? {
        repeated: IParsed<false>;
        count: number;
      }
    : {});

export function isRepeatToken(token: IParsed): token is IParsed<true> {
  return token.type == TokenType.Repeat;
}

export function insertFiles(code: string, root = ".") {
  if (!code.includes("@")) return code;
  let regex = /@\(#?[^)]+\)/g;
  let newCode = code.replace(regex, function (match: string) {
    let fileName = match.slice(2, -1);
    if (fileName.startsWith("#")) {
      fileName = fileName.slice(1);
      fileName = join(root, fileName);
    }
    let filePath = fileName.replace(".lzs", "") + ".lzs";
    if (!existsSync(filePath)) {
      throw new Error(`File ${fileName} [${filePath}] does not exist!`);
    }
    root = dirname(fileName);
    let contents = readFileSync(filePath, "utf8");
    contents = insertFiles(contents, root);
    return " " + contents + " ";
  });
  return newCode;
}

export function Parser(rawCode: string, root = ".") {
  let code = insertFiles(rawCode, root);
  code = cleanCode(code);
  let tokens = Tokenizer(code);

  let parsedTokens: IParsed[] = [];
  let inRepeat = false;
  let canBeRepeated = [
    TokenType.Value,
    TokenType.Pointer,
    TokenType.Print,
    TokenType.Delete,
    TokenType.Increament,
    TokenType.Decreament,
  ];
  for (let token of tokens) {
    if (inRepeat && !canBeRepeated.includes(token.type))
      throw new SyntaxError(`This token cannot be repeated: ${token.value}`);
    if (token.type == TokenType.PrintAll) {
      if (tokens.indexOf(token) == 0) {
        parsedTokens.push(token);
        continue;
      } else {
        throw new SyntaxError(`PrintAll must be the first token`);
      }
    }
    if (token.type == TokenType.Repeat) {
      inRepeat = true;
      parsedTokens.push({
        value: token.value,
        type: TokenType.Repeat,
        repeated: {},
        count: parseRepeatCount(token.value),
      } as IParsed<true>);
    } else {
      if (inRepeat) {
        (parsedTokens[parsedTokens.length - 1] as IParsed<true>).repeated =
          token;
        inRepeat = false;
      } else {
        parsedTokens.push(token);
      }
    }
  }

  return {
    tokens,
    rawCode,
    code,
    parsedTokens,
  };
}
