import { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { TAction } from '../../models/ui';
/**
 * Неймспейс с типизацией Popover
 */
export declare namespace NPopover {
    export type TRenderFunction = () => ReactNode;
    type TTooltipPlacement = 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
    export type TProps = {
        /**
         * Стили компонента
         */
        style?: CSSProperties;
        /**
         * Содеражание компонента
         */
        content?: ReactNode | TRenderFunction;
        /**
         * Классы стилей
         */
        className?: string;
        rootClassName?: string;
        /**
         * Положение компонента
         */
        placement?: TTooltipPlacement;
        /**
         * Типы триггеров
         */
        trigger?: TAction | TAction[];
        /**
         * Заголовок компонента
         */
        title?: ReactNode | TRenderFunction;
        /**
         * Дочерние элементы
         */
        children?: ReactNode;
        /**
         * Состояние открытия компонента
         */
        isOpen?: boolean;
        /**
         * Показывать ли галочку
         * */
        isArrow?: boolean;
        /**
         * Обработчик события изменения состояния открытия/закрытия выпадающего окна
         */
        onOpenChange?: (open: boolean, e?: MouseEvent<HTMLElement> | KeyboardEvent<HTMLDivElement>) => void;
        /**
         * Событие, показывающее кнопки в хедере
         */
        showHeaderButtons?: boolean;
        /**
         * Событие, показывающее кнопку закрытия компонента
         */
        showCloseIcon?: boolean;
        /**
         * Элементы для компонента хедера
         */
        headerButton?: ReactNode;
        /**
         * Максимальная высота компонента
         */
        maxHeight?: number;
        /**
         * Максимальная ширина компонента
         */
        maxWidth?: number;
        /**
         * Минимальная ширина компонента
         */
        minWidth?: number;
        /**
         * Функция для закрытия компонента
         */
        handleClose?: () => void;
    };
    export {};
}
