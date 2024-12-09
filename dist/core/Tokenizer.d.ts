export interface IToken {
    token: string;
    index: number;
    type: TokenType;
}
export declare enum TokenType {
    Unknown = 0,
    Comment = 1,
    Looper = 2,
    Reserved = 3,
    Block = 4
}
export declare class Tokenizer {
    #private;
    tokens: IToken[];
    code: string;
    static readonly CommentChar = "\"";
    static readonly Reserved: string[];
    static ReservedTokenInfo(token: IToken): {
        1: boolean;
        0: boolean;
        pointerNext: boolean;
        pointerPrevious: boolean;
        fileHead: boolean;
        print: boolean;
        log: boolean;
    };
    private static RawTokenize;
    static Tokenize(code: string): Tokenizer;
    private static GetTokenType;
    index: number;
    codeLines: {
        line: string;
        fromIndex: number;
    }[];
    private constructor();
    get size(): number;
    getLine(index: number): {
        line: string;
        fromIndex: number;
    };
    token(index?: number): IToken | null;
    locate(token?: IToken): {
        line: string;
        fromIndex: number;
    };
}
//# sourceMappingURL=Tokenizer.d.ts.map