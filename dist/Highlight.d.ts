export interface IHighlight {
    int: number;
    code: string;
}
export declare const TokenHighlight: Record<string, IHighlight>;
export interface IHighlighted {
    color: IHighlight;
    value: string;
    bold: boolean;
}
export declare function RawHighlight(code: string): IHighlighted[];
export declare function Highlight(code: string): string;
export declare function parseHighlighted(tokens: IHighlighted[]): string;
//# sourceMappingURL=Highlight.d.ts.map