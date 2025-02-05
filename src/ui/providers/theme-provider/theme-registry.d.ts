import { MappingAlgorithm } from 'antd';
import { ComponentsThemeConfig, ExtendedThemeConfig } from './models';
export interface ThemeRegistryStatic<T extends ThemeRegistry> {
    instance?: T;
    new (): T;
}
export interface Theme extends Pick<ExtendedThemeConfig, 'token'> {
    algorithm: string;
    id: string;
    components: ComponentsThemeConfig;
}
/**
 * Класс регистра тем. Позволяет регистрировать тему по её идентификатору и устанавливать
 * значение выбранной темы, сохраняя её `id` в локальное хранилище.
 */
export declare class ThemeRegistry {
    static instance: ThemeRegistry;
    /**
     * Имя свойства локального хранилища, в котором хранится `id` выбранной темы.
     * @default 'theme'
     */
    static themeLocalStoragePropertyName: string;
    /**
     * Маппинг алгоритмов темы по имени, указанному в её конфиге.
     * Поддерживает два варианта: тёмная тема и светлая.
     */
    static readonly ALGORITHM_MAP: Record<string, MappingAlgorithm>;
    /**
     * Таблица тем с идентификаторами в роли ключей.
     */
    protected themes: Record<string, ExtendedThemeConfig>;
    /**
     * Возвращает инстанс регистра тем.
     */
    static getInstance<T extends ThemeRegistry>(this: ThemeRegistryStatic<T>): T;
    constructor();
    /**
     * Получает значение `id` выбранной темы из локального хранилища.
     */
    get selectedId(): string;
    /**
     * Сохраняет значение `id` выбранной темы в локальное хранилище.
     */
    set selectedId(id: string);
    /**
     * Readonly-геттер, возвращающий выбранную тему.
     */
    get theme(): ExtendedThemeConfig;
    /**
     * Сохраняет алгоритм и значения токенов выбранной темы по её `id`.
     */
    registerTheme(id: string, algorithm: string, token: Theme['token'], components: ComponentsThemeConfig): void;
    /**
     * Возвращает значение темы по её `id`.
     */
    getTheme(id: string): ExtendedThemeConfig;
}
