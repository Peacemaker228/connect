import { default as React, AriaAttributes, CSSProperties, FC, MouseEvent, ReactNode } from 'react';
import { NButton } from '../../buttons';
type Closable = boolean | BaseClosable;
type BaseClosable = {
    closeIcon?: React.ReactNode;
} & AriaAttributes;
type ModalFooterRender = (originNode: React.ReactNode, extra: {
    OkBtn: FC;
    CancelBtn: FC;
}) => React.ReactNode;
type ModalClassNames = {
    header?: string;
    body?: string;
    footer?: string;
    mask?: string;
    wrapper?: string;
};
export type MousePosition = {
    x: number;
    y: number;
} | null;
type OkType = 'default' | 'primary' | 'link' | 'text';
type ModalType = 'default' | 'error' | 'info' | 'success' | 'warning';
/**
 * Модель пропсов компонента модального окна.
 *
 * @property {boolean} [isOpen] - Флаг состояния открытия окна.
 * @property {MousePosition} [icon] - Иконка в заголовке.
 * @property {boolean} [isConfirmLoading] - Флаг применения визуального эффекта загрузки для кнопки подтверждения.
 * @property {boolean} [isLoading] - Флаг применения визуального эффекта загрузки для всего модального окна.
 * @property {ReactNode} [title] - Заголовок.
 * @property {Closable} [closable] - Управление возможностями закрытия модального окна.
 * @property {Function} [onOk] - Коллбек нажатия кнопки подтверждения.
 * @property {Function} [onCancel] - Коллбек нажатия кнопки отмены.
 * @property {Function} [afterClose] - Коллбек события после закрытия модального окна.
 * @property {Function} [afterOpenChange] - Коллбек изменения состояния модального окна.
 * @property {boolean} [centered] - Флаг центрирования модального окна.
 * @property {string | number} [width] - Ширина.
 * @property {ModalFooterRender | ReactNode} [footer] - Футер.
 * @property {ReactNode} [okText] - Текст кнопки подтверждения.
 * @property {OkType} [okType] - Тип кнопки подтверждения.
 * @property {ReactNode} [cancelText] - Текст кнопки отмены.
 * @property {ReactNode} [cancelText] - Текст кнопки отмены.
 * @property {boolean} [maskClosable] - Флаг: закрывать ли модальное диалоговое окно при нажатии на маску (область вне модального окна).
 * @property {boolean} [forceRender] - Флаг принудительного рендеринга модального окна.
 * @property {ButtonProps} [okButtonProps] - Пропсы кнопки подтверждения.
 * @property {ButtonProps} [cancelButtonProps] - Пропсы кнопки отмены.
 * @property {boolean} [destroyOnClose] - Флаг анмаунт модального окна после закрытия.
 * @property {CSSProperties} [style] - Стили.
 * @property {string} [wrapClassName] - Имя класса контейнера модального окна.
 * @property {string} [maskTransitionName] - Имя класса маски анимации.
 * @property {string} [transitionName] - Имя класса анимации.
 * @property {string} [className] - Имя класса стилей.
 * @property {string} [rootClassName] - Имя класса корневого компонента.
 * @property {ModalClassNames} [classNames] - Объект конфигурации стилей компонента.
 * @property {string | HTMLElement | (() => HTMLElement) | false} [getContainer] - Установленный узел для модального окна.
 * @property {number} [zIndex]
 * @property {boolean} [mask] - Флаг отображения маски.
 * @property {boolean} [keyboard] - Флаг: возможность закрытия по ESC.
 * @property {string} [prefixCls]
 * @property {ReactNode} [closeIcon] - Иконка закрытия.
 * @property {Function} [modalRender] - Рендеринг кастомного содержимого модального окна.
 * @property {Function} [focusTriggerAfterClose] - Флаг фокусировки элемента-триггера после закрытия окна.
 * @property {ReactNode} [children] - Содержимое модального окна.
 * @property {MousePosition} [mousePosition] - Позиция мыши.
 * @property {ModalType} [modalType] - Тип модального окна.
 * */
export interface ModalProps {
    isOpen?: boolean;
    icon?: ReactNode;
    isConfirmLoading?: boolean;
    isLoading?: boolean;
    title?: ReactNode;
    closable?: Closable;
    onOk?: (e: MouseEvent<HTMLButtonElement>) => void;
    onCancel?: (e: MouseEvent<HTMLButtonElement>) => void;
    afterClose?: () => void;
    afterOpenChange?: (isOpen: boolean) => void;
    centered?: boolean;
    width?: string | number;
    footer?: ModalFooterRender | ReactNode;
    okText?: ReactNode;
    okType?: OkType;
    cancelText?: ReactNode;
    maskClosable?: boolean;
    forceRender?: boolean;
    okButtonProps?: NButton.TProps;
    cancelButtonProps?: NButton.TProps;
    destroyOnClose?: boolean;
    style?: CSSProperties;
    wrapClassName?: string;
    maskTransitionName?: string;
    transitionName?: string;
    className?: string;
    rootClassName?: string;
    classNames?: ModalClassNames;
    getContainer?: string | HTMLElement | (() => HTMLElement) | false;
    zIndex?: number;
    mask?: boolean;
    keyboard?: boolean;
    prefixCls?: string;
    closeIcon?: ReactNode;
    modalRender?: (node: ReactNode) => ReactNode;
    focusTriggerAfterClose?: boolean;
    children?: ReactNode;
    mousePosition?: MousePosition;
    modalType?: ModalType;
}
export {};
