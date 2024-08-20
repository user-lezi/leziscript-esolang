export declare enum EncodeStyle {
    Normal = 0,
    Printer = 1,
    OneSlot = 2
}
export declare function Encoder(str: string, style?: EncodeStyle): {
    values: number[];
    input: string;
    style: EncodeStyle;
    output: string;
    executionTime: number;
};
export declare function EncodeInAllStyles(str: string): {
    style: string;
    size: number;
    code: ReturnType<typeof Encoder>["output"];
    executionTime: ReturnType<typeof Encoder>["executionTime"];
}[];
//# sourceMappingURL=Encoder.d.ts.map