import { CSSProperties, ReactNode } from 'react';
import { ColSize } from 'antd/es/grid/col';
/**
 * @property {ReactNode} children - Компоненты
 * @property {string} [className] - Классы стилей
 * @property {CSSProperties} [style] - Css стили
 * @property {number | string | ColSize} [span] - Размер колонки 0-24
 * @property {number | string | ColSize} [xs] - Конфиги в диапозоне - screen < 576px
 * @property {number | string | ColSize} [sm] - Конфиги в диапозоне - screen ≥ 576px
 * @property {number | string | ColSize} [md] - Конфиги в диапозоне - screen ≥ 768px
 * @property {number | string | ColSize} [lg] - Конфиги в диапозоне - screen ≥ 992px
 * @property {number | string | ColSize} [xl] - Конфиги в диапозоне - screen ≥ 1200px
 * @property {number | string | ColSize} [xxl] - Конфиги в диапозоне - screen ≥ 1600px
 * */
interface Props {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
    span?: number | string;
    xs?: number | string | ColSize;
    sm?: number | string | ColSize;
    md?: number | string | ColSize;
    lg?: number | string | ColSize;
    xl?: number | string | ColSize;
    xxl?: number | string | ColSize;
    flex?: number | string;
    offset?: number | string;
    order?: number | string;
    pull?: number | string;
}
/**
 * Контейнер для колонок
 * */
export declare function Col(props: Props): import("react/jsx-runtime").JSX.Element;
export {};
