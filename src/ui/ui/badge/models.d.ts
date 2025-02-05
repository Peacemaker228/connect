import { CSSProperties, ReactNode } from 'react';
export declare namespace NBage {
    type TBadgeStatus = 'success' | 'processing' | 'error' | 'default' | 'warning';
    type TBadgeClassNames = {
        root?: string;
        indicator?: string;
    };
    export type TBageType = 'danger' | 'default' | 'primary';
    export type TProps = {
        children?: React.ReactNode;
        /**
         * Объект конфигурации стилей компонента
         */
        classNames?: TBadgeClassNames;
        /**
         * Настроить цвет точки значка
         */
        color?: string;
        /**
         * Контент для отображения в значке
         */
        count?: ReactNode;
        /**
         * Отображать ли красную точку вместо count
         */
        dot?: boolean;
        /**
         * Установить смещение точки значка
         */
        offset?: [number | string, number | string];
        /**
         * Максимальное количество для показа
         */
        overflowCount?: number;
        /**
         * Показывать ли значок, когда count ноль
         */
        showZero?: boolean;
        /**
         * Если count становлено, size задает размер значка
         */
        size?: 'default' | 'small';
        /**
         * Установить значок как точку статуса
         */
        status?: TBadgeStatus;
        style?: CSSProperties;
        /**
         * Если status установлено, text задает отображаемый текст статуса dot
         */
        text?: ReactNode;
        /**
         * Текст, отображаемый при наведении курсора на значок
         */
        title?: string;
        type?: TBageType;
    };
    export {};
}
