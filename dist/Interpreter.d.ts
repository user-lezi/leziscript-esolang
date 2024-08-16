export interface IInterpreterOptions {
    doNotLog: boolean;
}
export declare function Interpreter(code: string, opts?: Partial<IInterpreterOptions>, root?: string): {
    array: number[];
    code: string;
    output: string;
    logAll: boolean;
    executionTime: number;
    options: Partial<IInterpreterOptions>;
};
export declare function InterpretFiles(file: string, opts?: Partial<IInterpreterOptions>): {
    array: number[];
    code: string;
    output: string;
    logAll: boolean;
    executionTime: number;
    options: Partial<IInterpreterOptions>;
};
//# sourceMappingURL=Interpreter.d.ts.map