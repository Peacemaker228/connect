import { CSSProperties, ReactNode } from 'react';
type TType = 'default' | 'primary';
/**
 * Модель пропсов компонента Icon.
 *
 * @property {React.ReactNode} [icon] - Отображаемая иконка.
 * @property {number} [size] - Размер иконки.
 * @property {CSSProperties} [style] - Стили.
 * @property {string} [className] - Классы стилей.
 * */
interface IconProps {
    icon: ReactNode;
    size?: number;
    style?: CSSProperties;
    className?: string;
    type?: TType;
}
export declare const Icon: ({ icon, size, style, className, type }: IconProps) => import("react/jsx-runtime").JSX.Element;
export {};
