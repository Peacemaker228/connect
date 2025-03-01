import { CSSProperties, ReactElement, ReactNode } from 'react';
import { TSize } from '../../../models';
import { NBreadcrumb } from '../../navigation/breadcrumbs';
import { NTab } from '../../navigation/tabs/models';
import * as React from 'react';
/**
 * Неймспейс с типизацией Layout
 */
export declare namespace NLayout {
    export type TBasicProps = React.HTMLAttributes<HTMLDivElement> & {
        prefixCls?: string;
        children?: ReactNode;
        style?: CSSProperties;
        rootClassName?: string;
        hasSider?: boolean;
    };
    type TCollapseType = 'clickTrigger' | 'responsive';
    type TSiderTheme = 'light' | 'dark';
    export type TBasicSiderProps = React.HTMLAttributes<HTMLDivElement> & {
        prefixCls?: string;
        children?: ReactNode;
        className?: string | undefined;
        collapsible?: boolean;
        collapsed?: boolean;
        defaultCollapsed?: boolean;
        reverseArrow?: boolean;
        onCollapse?: (collapsed: boolean, type: TCollapseType) => void;
        zeroWidthTriggerStyle?: React.CSSProperties;
        trigger?: React.ReactNode;
        width?: number | string;
        collapsedWidth?: number | string;
        breakpoint?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
        theme?: TSiderTheme;
        onBreakpoint?: (broken: boolean) => void;
    };
    export type THeaderProps = TBasicProps & React.RefAttributes<HTMLElement> & {
        isShowTab?: boolean;
        isShowBreadCrumbs?: boolean;
        isShowMenuBtn?: boolean;
        isShowSiderPanel?: boolean;
        title?: string;
        menuIcon?: ReactNode;
        menuIconSize?: TSize;
        Tab?: ReactElement<NTab.TProps>;
        Breadcrumbs?: ReactElement<NBreadcrumb.TProps>;
        /**
         * Кнопки: поиск, инфо, уведомленя, профиль пользователя, выход
         */
        defaultButtons?: React.ReactNode;
        onToggleSider?: () => void;
    };
    export type TContentProps = TBasicProps & React.RefAttributes<HTMLElement>;
    export type TFooterProps = TBasicProps & React.RefAttributes<HTMLElement>;
    export type TSiderProps = TBasicSiderProps & React.RefAttributes<HTMLDivElement>;
    export type TSiderPanelProps = {
        /**Заголовок */
        title?: ReactNode;
        /**Стиль контента */
        className?: string;
        /**Контент */
        children: ReactNode;
        /**Признак, что боковая панель свернута */
        isCollapsed?: boolean;
    };
    export type TProps = TBasicProps & {
        /**
         * Цвет фона
         */
        color?: string | undefined;
    };
    export {};
}
