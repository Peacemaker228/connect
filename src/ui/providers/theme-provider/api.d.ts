import { ExtendedThemeConfig } from './models';
import { Theme } from './theme-registry';
/**
 * Регистрирует тему для её дальнейшего использования.
 */
export declare const registerTheme: ({ id, algorithm, token, components }: Theme) => void;
/**
 * Хук для взаимодействия с регистром тем.
 */
export declare const useThemeRegistry: () => [ExtendedThemeConfig, (id: string, isStrict?: boolean) => void];
