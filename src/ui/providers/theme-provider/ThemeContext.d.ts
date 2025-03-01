import { ExtendedThemeConfig } from './models';
/**
 * Контекст темы.
 * Возвращает текущую тему и функцию для выбора темы по её `id`.
 */
export declare const ThemeContext: import('react').Context<{
    theme: ExtendedThemeConfig;
    setTheme: (theme: string) => void;
}>;
