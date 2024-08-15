export declare enum TokenType {
    Value = 0,
    Pointer = 1,
    Repeat = 2,
    Print = 3,
    PrintAll = 4,
    Delete = 5,
    CopyNext = 6
}
export declare function getTokenType(token: string): TokenType;
export interface IToken {
    value: string;
    type: TokenType;
}
export declare function Tokenizer(code: string): IToken[];
//# sourceMappingURL=Tokenizer.d.ts.map