import { IToken, Tokenizer } from "./Tokenizer";
export declare enum ParsedTokenType {
    Loop = 0,
    Block = 1,
    File = 2,
    Normal = 3
}
export type IParsedTokenData<T extends ParsedTokenType> = T extends ParsedTokenType.Loop ? {
    loopCount: number;
    code: ParsedToken<ParsedTokenType>;
} : T extends ParsedTokenType.Block ? {
    code: ParsedToken<ParsedTokenType>[];
} : T extends ParsedTokenType.File ? {
    filename: string;
} : ReturnType<typeof Tokenizer.ReservedTokenInfo>;
export declare class ParsedToken<T extends ParsedTokenType> {
    type: T;
    token: IToken;
    data: IParsedTokenData<T>;
    constructor(type: T, token: IToken);
    isLoop(): this is ParsedToken<ParsedTokenType.Loop>;
    isBlock(): this is ParsedToken<ParsedTokenType.Block>;
    isFile(): this is ParsedToken<ParsedTokenType.File>;
    isNormal(): this is ParsedToken<ParsedTokenType.Normal>;
    toString(indent?: number): string;
}
export interface ParserOptions {
    checkFiles: boolean;
}
export declare const DefaultParserOptions: ParserOptions;
export declare class Parser {
    #private;
    static readonly LoopValues: {
        "?": number;
        "!": number;
    };
    static Parse(code: string, options?: Partial<ParserOptions>): Parser;
    static ParseLoopCount(token: string): number;
    tokens: ParsedToken<ParsedTokenType>[];
    options: ParserOptions;
    constructor(tokenizer: Tokenizer, options?: Partial<ParserOptions>);
    get tokenizer(): Tokenizer;
    get size(): number;
    toString(indent?: number): string;
    code(): string;
}
//# sourceMappingURL=Parser.d.ts.map