import { default as React, ReactNode } from 'react';
import { TAction } from '../../models/ui';
import { NTag } from '..';
/**
 * Неймспейс с типизацией Tooltip
 */
export declare namespace NTooltip {
    type TAlignPoint = `${TAlignPointTopBottom}${TAlignPointLeftRight}`;
    type TAlignPointTopBottom = 't' | 'b' | 'c';
    type TAlignPointLeftRight = 'l' | 'r' | 'c';
    type TOffset = number | `${number}%`;
    type TAlign = {
        points?: (string | TAlignPoint)[];
        offset?: TOffset[];
        targetOffset?: TOffset[];
        overflow?: {
            adjustX?: boolean | number;
            adjustY?: boolean | number;
            shiftX?: boolean | number;
            shiftY?: boolean | number;
        };
        autoArrow?: boolean;
        htmlRegion?: 'visible' | 'scroll' | 'visibleFirst';
        dynamicInset?: boolean;
        useCssRight?: boolean;
        useCssBottom?: boolean;
        useCssTransform?: boolean;
        ignoreShake?: boolean;
    };
    type TAdjustOverflow = {
        adjustX?: 0 | 1;
        adjustY?: 0 | 1;
    };
    type TLiteralUnion<T extends string> = T | (string & {});
    export type TPlacement = 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
    export type TProps = {
        /**
         * Тайтл атрибут
         */
        title?: React.ReactNode | (() => React.ReactNode);
        /**
         * Это значение будет добавлено в конфигурацию места размещения
         */
        align?: TAlign;
        /**
         * Изменение стрелки
         */
        arrow?: boolean | {
            pointAtCenter?: boolean;
        };
        /**
         * Это значение будет добавлено в конфигурацию места размещения
         */
        autoAdjustOverflow?: boolean | TAdjustOverflow;
        /**
         * Цвет
         */
        color?: TLiteralUnion<NTag.PresetColorType>;
        /**
         * Значение открытого состояния
         */
        isDefaultOpen?: boolean;
        /**
         * Должен ли Tooltip быть открыт по умолчанию
         */
        shouldDestroyTooltipOnHide?: boolean;
        /**
         * Указывает, что Tooltip будет всегда обновлять содержимое, даже когда он закрыт.
         * По умолчанию Tooltip кэширует содержимое при закрытии
         */
        isFresh?: boolean;
        /**
         * Контейнер всплывающей подсказки
         */
        getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
        /**
         * Задержка в секундах перед показом Tooltip при наведении мыши
         */
        mouseEnterDelay?: number;
        /**
         * адержка в секундах перед скрытием Tooltip при уходе мыши
         */
        mouseLeaveDelay?: number;
        /**
         * Имя CSS-класса всплывающей подсказки
         */
        overlayClassName?: string;
        /**
         * Стили для оверлея в компоненте
         */
        overlayStyle?: React.CSSProperties;
        /**
         * Внутренние стили для оверлея в компоненте
         */
        overlayInnerStyle?: React.CSSProperties;
        /**
         * Расположение, относительно целевого элемента
         */
        placement?: TPlacement;
        /**
         * Типы триггеров
         */
        trigger?: TAction | TAction[];
        /**
         * Указывает, открыт ли компонент в данный момент
         */
        isOpen?: boolean;
        /**
         * Значение z-index
         */
        zIndex?: number;
        /**
         * Обработчик события изменения открытия/закрытия компонента
         */
        onOpenChange?: (visible: boolean) => void;
        /**
         * Дочерние элементы
         */
        children?: React.ReactNode;
        /**
         * Указывает, отключен ли компонент
         */
        isDisabled?: boolean;
        /**
         * Построчное заполнение тултипа в формате Имя: Значение
         */
        combined?: TTooltipCombined;
        /**
         * Ширина тултипа
         */
        width?: string;
    };
    /**
     * Строка комбинированного тултипа
     *
     * @param {ReactNode} [label] - метка
     * @param {ReactNode} [value] - описание
     */
    export type TTooltipRow = {
        label?: ReactNode;
        value?: ReactNode;
    };
    /**
     * Комбинированный тултип
     *
     * @param {'single' | 'double'} [type] - тип тултипа:'single' - в одну строку, 'double' - в две строки.
     * @param {TTooltipRow[]} [rows] - массив строк тултипа
     */
    export type TTooltipCombined = {
        type?: 'single' | 'double';
        rows?: TTooltipRow[];
    };
    export {};
}
