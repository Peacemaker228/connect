import { default as React, CSSProperties, HTMLAttributeReferrerPolicy, MouseEvent } from 'react';
import { NTooltip } from '../tooltip/models';
export declare namespace NTypography {
    export type TBaseType = 'secondary' | 'success' | 'warning' | 'danger';
    export const TITLE_ELE_LIST: readonly [1, 2, 3, 4, 5];
    type TAutoSizeType = {
        minRows?: number;
        maxRows?: number;
    };
    type TCopyConfig = {
        text?: string | (() => string | Promise<string>);
        onCopy?: (event?: MouseEvent<HTMLButtonElement>) => void;
        icon?: React.ReactNode;
        tooltips?: React.ReactNode;
        format?: 'text/plain' | 'text/html';
        tabIndex?: number;
    };
    type TEditConfig = {
        text?: string;
        isEditing?: boolean;
        icon?: React.ReactNode;
        tooltip?: React.ReactNode;
        onStart?: () => void;
        onChange?: (value: string) => void;
        onCancel?: () => void;
        onEnd?: () => void;
        maxLength?: number;
        isAutoSize?: boolean | TAutoSizeType;
        triggerType?: ('icon' | 'text')[];
        enterIcon?: React.ReactNode;
    };
    type TEllipsisConfig = {
        rows?: number;
        isExpandable?: boolean | 'collapsible';
        suffix?: string;
        symbol?: React.ReactNode | ((expanded: boolean) => React.ReactNode);
        isDefaultExpanded?: boolean;
        isExpanded?: boolean;
        onExpand?: (event: MouseEvent<HTMLElement, MouseEvent>, info: {
            isExpanded: boolean;
        }) => void;
        onEllipsis?: (ellipsis: boolean) => void;
        tooltip?: React.ReactNode | NTooltip.TProps;
    };
    export type TTextProps = TBaseElement & {
        isEllipsis?: boolean | Omit<TEllipsisConfig, 'isExpandable' | 'rows' | 'onExpand'>;
    };
    export type TTitleProps = Omit<TBaseElement, 'isStrong'> & {
        /**
         * Убирает все отступы
         */
        isRemoveAllMargins?: boolean;
        level?: (typeof TITLE_ELE_LIST)[number];
    };
    export type TParagraphProps = TBaseElement;
    export type TLinkProps = TBaseElement & {
        isEllipsis?: boolean;
        download?: any;
        target?: React.HTMLAttributeAnchorTarget | undefined;
        href?: string | undefined;
        hrefLang?: string | undefined;
        type?: string | undefined;
        referrerPolicy?: HTMLAttributeReferrerPolicy | undefined;
    };
    export type TBaseElement = {
        /**ы
         * Заголовок элемента
         */
        title?: string;
        /**
         * Дочерние элементы компонента
         */
        children?: React.ReactNode;
        /**
         * Состояние редактирования
         */
        isEditable?: boolean | TEditConfig;
        /**
         * Состояние копирования
         */
        isCopyable?: boolean | TCopyConfig;
        /**
         * Тип элемента
         */
        type?: TBaseType;
        /**
         * Состояние активности
         */
        isDisabled?: boolean;
        /**
         * Состояние многоточия
         */
        isEllipsis?: boolean | TEllipsisConfig;
        /**
         * Отображение элемента как код
         */
        isCode?: boolean;
        /**
         * Флаг отметки
         */
        isMark?: boolean;
        /**
         * Состояние подчеркивания
         */
        isUnderline?: boolean;
        /**
         * Состояние удаления
         */
        isDelete?: boolean;
        /**
         * Состояние жирного начертания
         */
        isStrong?: boolean;
        /**
         * Отображение элемента в клавиатурном стиле
         */
        isKeyboard?: boolean;
        /**
         * Состояние курсива
         */
        isItalic?: boolean;
        /**
         * Стили компонента
         */
        style?: CSSProperties;
        /**
         * Классы стилей
         */
        className?: string | undefined;
    };
    export {};
}
