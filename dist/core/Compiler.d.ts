import { Parser, ParserOptions } from "./Parser";
import { Tokenizer } from "./Tokenizer";
export interface ICompilerOptions {
    parser: ParserOptions;
    codeIndent: number;
    minify: boolean;
}
export declare const DefaultCompilerOption: ICompilerOptions;
export declare class Compiler {
    #private;
    static Compile(code: string, options?: Partial<ICompilerOptions>): Compiler;
    options: ICompilerOptions;
    constructor(parser: Parser, options?: Partial<ICompilerOptions>);
    get parser(): Parser;
    get tokenizer(): Tokenizer;
    get code(): string;
    run(): Promise<{
        outputCode: string;
        exectionTime: number;
    }>;
}
//# sourceMappingURL=Compiler.d.ts.map