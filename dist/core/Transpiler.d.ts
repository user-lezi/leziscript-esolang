import { Parser, ParserOptions } from "./Parser";
import { Tokenizer } from "./Tokenizer";
export interface ITranspilerOptions {
    parser: ParserOptions;
    codeIndent: number;
    minify: boolean;
}
export declare const DefaultTranspilerOption: ITranspilerOptions;
export declare class Transpiler {
    #private;
    static Transpile(code: string, options?: Partial<ITranspilerOptions>): Transpiler;
    options: ITranspilerOptions;
    constructor(parser: Parser, options?: Partial<ITranspilerOptions>);
    __incLoopIteratorCount(): number;
    get parser(): Parser;
    get tokenizer(): Tokenizer;
    get code(): string;
    run(): {
        outputCode: string;
        executionTime: number;
    };
}
//# sourceMappingURL=Transpiler.d.ts.map