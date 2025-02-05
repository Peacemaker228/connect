import { MenuProps } from 'antd/es/menu';
export declare namespace NDropdown {
    type TPlacement = 'topLeft' | 'topCenter' | 'topRight' | 'bottomLeft' | 'bottomCenter' | 'bottomRight' | 'top' | 'bottom';
    export type TAdjustOverflow = {
        adjustX?: 0 | 1;
        adjustY?: 0 | 1;
    };
    export type TDropdownArrowOptions = {
        pointAtCenter?: boolean;
    };
    export type TProps = {
        /**
         * Состояние видимости стрелки выпадающего списка
         */
        isArrow?: boolean | TDropdownArrowOptions;
        /**
         * Состояние автоматического отступа выпадающего списка
         */
        isAutoAdjustOverflow?: boolean | TAdjustOverflow;
        isDisabled?: boolean;
        /**
         * Состояние отображения выпадающего списка при закрытии
         */
        shouldDestroyPopupOnHide?: boolean;
        /**
         * Настройка содержимого выпадающего списка
         */
        dropdownRender?: (originNode: React.ReactNode) => React.ReactNode;
        /**
         * Функция для получения контейнера для отображения выпадающего списка
         */
        getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
        /**
         * Параметры выпадающего списка
         */
        menu?: MenuProps;
        /**
         * Имя класса корневого элемента выпадающего списка
         */
        overlayClassName?: string;
        /**
         * Стиль корневого элемента выпадающего списка
         */
        overlayStyle?: React.CSSProperties;
        /**
         * Расположение выпадающего списка
         */
        placement?: TPlacement;
        trigger?: ('click' | 'hover' | 'contextMenu')[];
        isOpen?: boolean;
        onOpenChange?: (open: boolean, info: {
            source: 'trigger' | 'menu';
        }) => void;
        children?: React.ReactNode;
        countBadge?: React.ReactNode;
    };
    export {};
}
