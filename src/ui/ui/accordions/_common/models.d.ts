import { TSize as TSizeCommon } from '../../../models';
export type TCollapseExpandIconPosition = 'start' | 'end';
export type TCollapsible = 'header' | 'icon' | 'disabled';
export type TPanelProps = {
    className?: string;
    collapsible?: TCollapsible;
    extra?: React.ReactNode;
    forceRender?: boolean;
    header?: React.ReactNode;
    isActive?: boolean;
    showArrow?: boolean;
    style?: React.CSSProperties;
};
export type TCollapseItem = React.DOMAttributes<HTMLDivElement> & {
    children?: React.ReactNode;
    className?: string;
    collapsible?: TCollapsible;
    destroyInactivePanel?: boolean;
    extra?: string | React.ReactNode;
    forceRender?: boolean;
    headerClass?: string;
    id?: string;
    key?: string | number;
    label?: string | React.ReactNode;
    onItemClick?: (panelKey: string | number | bigint) => void;
    ref?: React.RefObject<HTMLDivElement>;
    role?: string;
    showArrow?: boolean;
    style?: object;
};
export type TBaseProps = {
    className?: string;
    /**
     * Отключение складывания панелей или изменение триггера срабатывания
     */
    collapsible?: TCollapsible;
    /**
     * FIXME: ???
     */
    defaultActiveKey?: (string | number)[] | string | number;
    /**
     * Кастомизация иконки
     */
    expandIcon?: (panelProps: TPanelProps) => React.ReactNode;
    /**
     * Положение иконки
     */
    expandIconPosition?: TCollapseExpandIconPosition;
    isBordered?: boolean;
    isGhost?: boolean;
    /**
     * FIXME: ???
     */
    items?: TCollapseItem[];
    onChange?: (key: string | string[]) => void;
    /**
     * Класс перфикса
     */
    prefixCls?: string;
    /**
     * Класс чего-то еще
     */
    rootClassName?: string;
    /**
     * Уничтожение неактивных панелей
     */
    shouldDestroyInactivePanel?: boolean;
    size?: TSizeCommon;
    style?: React.CSSProperties;
};
