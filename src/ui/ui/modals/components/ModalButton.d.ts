import { ComponentType, MouseEvent } from 'react';
import { ModalProps } from '../common';
type BtnClickHandler = (event: MouseEvent<HTMLButtonElement>) => void;
/**
 * Модель пропсов компонента модального окна с кнопкой открытия.
 *
 * @property {ComponentType<BtnProps>} Button - Cсылка на компонент кнопки открытия.
 * @property {ComponentType<BtnProps>} buttonProps - Cсылка на компонент кнопки открытия.
 * @property {boolean} [initialIsOpen] - Флаг начального состояния компонента.
 * */
interface ModalButtonProps<BtnProps extends {
    onClick: BtnClickHandler;
}> extends Omit<ModalProps, 'isOpen'> {
    Button: ComponentType<BtnProps>;
    buttonProps: BtnProps;
    initialIsOpen?: boolean;
}
/**
 * Компонент модального окна с кнопкой открытия.
 *
 * @param {ModalButtonProps<ButtonProps>} props - Пропсы компонента.
 * */
export declare function ModalButton<BtnProps extends {
    onClick: BtnClickHandler;
}>(props: ModalButtonProps<BtnProps>): import("react/jsx-runtime").JSX.Element;
export {};
