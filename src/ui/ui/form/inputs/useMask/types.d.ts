export type Mask = (string | RegExp)[];
export interface UseMaskOptions {
    mask: Mask | ((value: string) => Mask);
    value?: string;
}
