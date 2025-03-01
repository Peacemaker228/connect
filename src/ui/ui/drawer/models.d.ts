import { XOR } from 'ts-xor';
import * as React from 'react';
/**
 * Неймспейс с типизацией Drawer
 */
export declare namespace NDrawer {
    type TSizeType = 'default' | 'large';
    type TPlacement = 'left' | 'top' | 'right' | 'bottom';
    type TContainerType = Element | DocumentFragment;
    type TGetContainer = string | TContainerType | (() => TContainerType) | false;
    type TPushConfig = {
        distance?: number | string;
    };
    type TClassNames = {
        mask?: string;
        wrapper?: string;
        content?: string;
    };
    type TStyles = {
        header?: React.CSSProperties;
        body?: React.CSSProperties;
        footer?: React.CSSProperties;
    };
    type TPortalProps = {
        getContainer?: TGetContainer;
        children?: React.ReactNode;
        open?: boolean;
        autoDestroy?: boolean;
        autoLock?: boolean;
        debug?: string;
    };
    type TDefaultFooterProps = {
        onClose?: (e: React.MouseEvent | React.KeyboardEvent) => void;
        cancelBtnText?: string;
        onCancel?: () => void;
        acceptBtnText?: string;
        onAccept?: () => void;
    };
    type TBaseProps = {
        /**
         * Состояние фокуса после открытия
         */
        autoFocus?: boolean;
        /**
         * Состояние компонента после открытия
         */
        afterOpenChange?: (open: boolean) => void;
        /**
         * Стили компонента
         */
        style?: React.CSSProperties;
        /**
         * Классы стилей
         */
        className?: string;
        /**
         * Классы для разных частей компонента
         */
        classNames?: TClassNames;
        /**
         * Иконка закрытия
         */
        closeIcon?: React.ReactNode;
        /**
         * Состояние отвечающее за уничтожение компонента после закрытия
         */
        isDestroyOnClose?: boolean;
        /**
         * Область для дополнительных действий в углу компонента
         */
        extra?: React.ReactNode;
        /**
         * Состояние отвечающее за отрисовку компонента
         */
        isForceRender?: boolean;
        /**
         * Контейнер для рендеринга компонента
         */
        getContainer?: TPortalProps['getContainer'];
        /**
         * Высота компонента
         */
        height?: number | string;
        /**
         * Ширина компонента
         */
        width?: number | string;
        /**
         * Флаг, указывающий, надо ли реагировать на клавиатурные события
         */
        isKeyboard?: boolean;
        /**
         * Флаг, указывающий, надо ли рендерить маску
         */
        isMask?: boolean;
        /**
         * Флаг, указывающий, можно ли закрыть компонент по клику на маску
         */
        isMaskClosable?: boolean;
        /**
         * Позиция комопнента
         */
        placement?: TPlacement;
        /**
         * Состояние пуша
         */
        isPush?: boolean | TPushConfig;
        /**
         * Стили для корневого компонента
         */
        rootStyle?: React.CSSProperties;
        /**
         * Стили для разных частей компонента
         */
        styles?: TStyles;
        /**
         * Размер компонента
         */
        size?: TSizeType;
        /**
         * Заголовок компонента
         */
        title?: React.ReactNode;
        /**
         * Состояние загрузки компонента
         */
        isLoading?: boolean;
        /**
         * Состояние открытия компонента
         */
        isOpen?: boolean;
        /**
         * zIndex компонента
         */
        zIndex?: number;
        /**
         * Функция, вызываемая при закрытии компонента
         */
        onClose?: (e: React.MouseEvent | React.KeyboardEvent) => void;
        /**
         * Функция для рендеринга компонента
         */
        drawerRender?: (node: React.ReactNode) => React.ReactNode;
        /**
         * Дочерние элементы
         */
        children?: React.ReactNode;
        /**
         * Состояние изменения ширины компонента
         */
        isResizable?: boolean;
        /**
         * Минимальная ширина компонента
         */
        minWidth?: number | string;
        /**
         * Максимальная ширина компонента
         */
        maxWidth?: number | string;
        /**
         * Минимальная высота компонента
         */
        minHeight?: number | string;
        /**
         * Максимальная высота компонента
         */
        maxHeight?: number | string;
        /**
         * Флаг, убирающий все paddings у body Drawer:
         */
        withoutDrawerBodyPadding?: number | string;
    };
    type TProps = TBaseProps & XOR<{
        /**
         * Дефолтный футер:
         */
        withDefaultFooter?: boolean;
        /**
         * Настройка пропсов для дефолтного футера:
         */
        defaultFooterProps?: Omit<TDefaultFooterProps, 'onClose'>;
    }, {
        /**
         * Кастомный футер:
         */
        customFooter?: React.ReactNode;
    }>;
}
