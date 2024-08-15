export enum TokenType {
  Value,
  Pointer,
  Repeat,
  Print,
  PrintAll,
  Delete,
  CopyNext,
}

export function getTokenType(token: string) {
  if (typeof token !== "string")
    throw new TypeError(`Expected token to be a string, got ${typeof token}`);
  if (token.length < 1)
    throw new TypeError(`Expected token to be a non-empty string.`);

  if (token == "[]" || token == "[[]]") return TokenType.Value;
  if (token == ">" || token == "<") return TokenType.Pointer;
  if (/^\[[!?]+\]$/.test(token)) return TokenType.Repeat;
  if (token == ".") return TokenType.Print;
  if (token == "$") return TokenType.PrintAll;
  if (token == "!") return TokenType.Delete;
  if (token == ":") return TokenType.CopyNext;

  throw new SyntaxError(
    `Expected token to be a valid token type, got ${token}`,
  );
}

export interface IToken {
  value: string;
  type: TokenType;
}

export function Tokenizer(code: string) {
  if (typeof code !== "string")
    throw new TypeError(`Expected code to be a string, got ${typeof code}`);
  if (code.length < 1)
    throw new TypeError(`Expected code to be a non-empty string.`);

  let tokens: string[] = [];
  let token = "";
  let depth = 0;
  for (let i = 0; i < code.length; i++) {
    let c = code[i];
    if (depth > 0) {
      if (c == "]") {
        depth--;
      }
      token += c;
      if (depth == 0) {
        tokens.push(token);
        token = "";
      }
      if (c == "[") {
        depth++;
      }
    } else if (depth < 0) {
      throw new SyntaxError(`Uh!! got error at ${i + 1}\n> ${code[i]}`);
    } else {
      if (c == "[") {
        depth++;
        if (token) {
          tokens.push(token);
          token = "";
        }
      }
      token += c;
    }
  }
  if (depth !== 0) throw new SyntaxError("Unclosed brackets!");
  if (token) tokens.push(token);
  let tokens2: IToken[] = [];
  for (let i = 0; i < tokens.length; i++) {
    let token = tokens[i];
    if (token.includes("[")) {
      tokens2.push({
        value: token,
        type: getTokenType(token),
      });
    } else {
      let splits = token.split("");
      for (let split of splits) {
        tokens2.push({
          value: split,
          type: getTokenType(split),
        });
      }
    }
  }
  return tokens2;
}
