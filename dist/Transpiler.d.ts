export interface ITranspilerOptions {
    minify: boolean;
    beautify: boolean;
}
export declare function Transpiler(code: string, opts?: Partial<ITranspilerOptions>, root?: string): {
    code: string;
    options: Partial<ITranspilerOptions>;
    executionTime: number;
};
export declare function TranspileFiles(file: string, opts?: Partial<ITranspilerOptions>): {
    code: string;
    options: Partial<ITranspilerOptions>;
    executionTime: number;
};
//# sourceMappingURL=Transpiler.d.ts.map