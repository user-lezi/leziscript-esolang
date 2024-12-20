import { readFileSync } from "fs";
import { resolveFileName } from "../util";
import {
  DefaultParserOptions,
  ParsedToken,
  ParsedTokenType,
  Parser,
  ParserOptions,
} from "./Parser";
import { Tokenizer } from "./Tokenizer";

export interface IInterpreterOptions {
  doNotLog: boolean;
  parser: ParserOptions;
}
export const DefaultInterpreterOption: IInterpreterOptions = {
  doNotLog: false,
  parser: DefaultParserOptions,
};
export class Interpreter {
  public static Interpret(
    code: string,
    options?: Partial<IInterpreterOptions>,
  ) {
    return new this(Parser.Parse(code, options?.parser), options);
  }
  #parser: Parser;
  #tokenizer: Tokenizer;
  public constructor(
    parser: Parser,
    public options: Partial<IInterpreterOptions> = DefaultInterpreterOption,
  ) {
    this.#parser = parser;
    this.#tokenizer = parser.tokenizer;
  }

  public get parser() {
    return this.#parser;
  }
  public get tokenizer() {
    return this.#tokenizer;
  }
  public get code() {
    return this.#parser.code();
  }

  public run() {
    let executionTimeStart = performance.now();
    let internal = {
      pointer: 0,
      bits: new Int32Array(3000),
      print: function print() {
        return String.fromCharCode(this.bits[this.pointer]);
      },
    };
    let output = "";
    let queue: ParsedToken<ParsedTokenType>[] = [];
    queue.push(this.#parser.tokens.shift()!);
    while (queue.length > 0) {
      let token = queue.shift();
      if (token) {
        if (token.isBlock()) queue.unshift(...token.data.code);
        else {
          if (token.isFile()) {
            let name = resolveFileName(token.data.filename);
            let contents = readFileSync(name, "utf8");
            let parsedTokens = Parser.Parse(
              contents,
              this.options.parser,
            ).tokens;
            queue.unshift(...parsedTokens);
          } else if (token.isLoop()) {
            let count = token.data.loopCount;
            for (let i = 0; i < count; i++) {
              queue.unshift(token.data.code);
            }
          } else if (token.isNormal()) {
            /* Actual working */
            let info = token.data;

            if (info.pointerNext || info.pointerPrevious) {
              /*
              Pointers 
              > or < 
             */
              internal.pointer += info.pointerNext ? 1 : -1;
            } else if (info.print) {
              /* 
              Print
              .
             */
              output += internal.print();
            } else if (info.log && !this.options.doNotLog) {
              /* 
              Log
              #
             */
              console.log(internal.print());
            } else if (info.copy) {
              /* 
              Copy
              :
             */
              internal.bits[internal.pointer + 1] =
                internal.bits[internal.pointer];
              internal.pointer++;
            } else if (info.delete) {
              /* 
              Delete
              !
             */
              internal.bits[internal.pointer] >>= 1;
            } else if (info[0] || info[1]) {
              /* 
              Value
              [[]] or []
             */

              internal.bits[internal.pointer] <<= 1;
              if (info[1]) internal.bits[internal.pointer] += 1;
            }
          }
        }
        if (queue.length == 0 && this.#parser.tokens.length > 0)
          queue.push(this.#parser.tokens.shift()!);
      }
    }

    return {
      internal,
      output,
      exectionTime: performance.now() - executionTimeStart,
    };
  }
}
