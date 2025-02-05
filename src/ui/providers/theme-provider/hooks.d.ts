/**
 * Хук для использования контекста тем. Возвращает текущую тему и метод для выбора темы по `id`.
 */
export declare const useTheme: () => {
    theme: import('./models').ExtendedThemeConfig;
    setTheme: (theme: string) => void;
};
