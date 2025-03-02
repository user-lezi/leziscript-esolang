export declare enum ReverseInterpretType {
    CharacterByCharacter = 0,
    PreloadAndPrint = 1
}
export interface IReverseInterpreterOptions {
    type: ReverseInterpretType;
    minify: boolean;
}
export declare class ReverseInterpreter {
    private static MinifyCode;
    static ConvertN(n: number): string;
    static ReverseInterpret(text: string, opts?: Partial<IReverseInterpreterOptions>): {
        code: string;
        options: Partial<IReverseInterpreterOptions>;
        executionTime: number;
    };
}
//# sourceMappingURL=ReverseInterpreter.d.ts.map