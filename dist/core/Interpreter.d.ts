import { Parser, ParserOptions } from "./Parser";
import { Tokenizer } from "./Tokenizer";
export interface IInterpreterOptions {
    doNotLog: boolean;
    parser: ParserOptions;
}
export declare const DefaultInterpreterOption: IInterpreterOptions;
export declare class Interpreter {
    #private;
    options: Partial<IInterpreterOptions>;
    static Interpret(code: string, options?: Partial<IInterpreterOptions>): Interpreter;
    constructor(parser: Parser, options?: Partial<IInterpreterOptions>);
    get parser(): Parser;
    get tokenizer(): Tokenizer;
    get code(): string;
    run(): {
        internal: {
            pointer: number;
            bits: Int32Array<ArrayBuffer>;
            print: () => string;
        };
        output: string;
        exectionTime: number;
    };
}
//# sourceMappingURL=Interpreter.d.ts.map