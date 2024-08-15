import { TokenType, IToken, Tokenizer } from "./Tokenizer";

export function cleanCode(code: string) {
  if (typeof code !== "string")
    throw new TypeError("Expected code to be a string, got " + typeof code);
  /* Comments / Unwanted Characters */
  return code.replace(/'[^']*'/g, "").replace(/[^\[\]><.!?:$]+/g, "");
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

export function Parser(code: string) {
  code = cleanCode(code);
  let tokens = Tokenizer(code);

  let parsedTokens: IParsed[] = [];
  let inRepeat = false;
  let canBeRepeated = [
    TokenType.Value,
    TokenType.Pointer,
    TokenType.Print,
    TokenType.Delete,
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
    code,
    parsedTokens,
  };
}
