import { Parser, isRepeatToken } from "./Parser";
import { TokenType } from "./Tokenizer";

export interface IHighlight {
  int: number;
  code: string;
}

export const TokenHighlight = {
  Unknown: {
    int: -1,
    code: "\x1b[0m",
  },
  Value: parse(0xffae00),
  Pointer: parse(0xf0d1ff),
  Repeat: parse(0x94d6ff),
  Repeated: parse(0x4dbbff),
  Print: parse(0xccffcc),
  PrintAll: parse(0x009900),
  Delete: parse(0xff4d4d),
  CopyNext: parse(0xf2ff66),
  Increament: parse(0xccff99),
  Decreament: parse(0xccff99),
} as Record<string, IHighlight>;

function parse(int: number) {
  let red = int >> 16;
  let green = (int >> 8) & 255;
  let blue = int & 255;
  return {
    int,
    code: `\x1b[38;2;${red};${green};${blue}m`,
  };
}

export interface IHighlighted {
  color: IHighlight;
  value: string;
  bold: boolean;
}

export function RawHighlight(code: string): IHighlighted[] {
  let tokens = Parser(code).parsedTokens;
  let output: IHighlighted[] = [];
  for (let token of tokens) {
    if (isRepeatToken(token)) {
      output.push({
        color: TokenHighlight.Repeat,
        value: token.value,
        bold: false,
      });
      output.push({
        color: TokenHighlight.Repeated,
        value: token.repeated.value,
        bold: true,
      });
    } else {
      let color =
        TokenHighlight[TokenType[token.type]] ?? TokenHighlight.Unknown;
      output.push({
        color,
        value: token.value,
        bold: false,
      });
    }
  }
  return output;
}

export function Highlight(code: string) {
  return parseHighlighted(RawHighlight(code));
}

export function parseHighlighted(tokens: IHighlighted[]) {
  let output = "";
  for (let token of tokens) {
    output +=
      (token.bold ? "\x1b[1m" : "") +
      token.color.code +
      token.value +
      "\x1b[0m";
  }
  return output;
}
