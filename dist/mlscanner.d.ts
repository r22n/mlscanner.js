export interface Output {
    result: "found" | "not-found";
    found?: Found;
}
export interface Found {
    addr: string;
    pos: Position;
    input: string;
}
export interface Position {
    at: number;
    appear: number;
    end: number;
}
export declare function mlscanbox(input: string): Output;
