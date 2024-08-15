import { IToken } from "./Tokenizer";
export declare function cleanCode(code: string): string;
export declare function parseRepeatCount(token: string): number;
export type IParsed<T = false> = IToken & (T extends true ? {
    repeated: IParsed<false>;
    count: number;
} : {});
export declare function isRepeatToken(token: IParsed): token is IParsed<true>;
export declare function Parser(code: string): {
    tokens: IToken[];
    code: string;
    parsedTokens: IToken[];
};
//# sourceMappingURL=Parser.d.ts.map