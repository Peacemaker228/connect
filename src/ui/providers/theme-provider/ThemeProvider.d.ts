import { ReactNode } from 'react';
import { ThemeConfig } from 'antd';
interface ThemeProviderProps {
    theme?: ThemeConfig;
    children: ReactNode;
}
export declare function ThemeProvider({ children }: ThemeProviderProps): import("react/jsx-runtime").JSX.Element;
export {};
