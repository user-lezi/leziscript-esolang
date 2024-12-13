export declare function format(text: string, code: number): `\u001B[${number}m${string}\u001B[0m`;
export declare function boldText(text: string): `\u001B[${number}m${string}\u001B[0m`;
export declare function redText(text: string): `\u001B[${number}m${string}\u001B[0m`;
export declare function sliceText(text: string, startIndex: number, endIndex: number): readonly [string, string, string];
export declare function resolveFileName(filename: string): string;
//# sourceMappingURL=util.d.ts.map