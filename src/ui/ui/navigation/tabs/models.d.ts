import { DropdownProps } from 'antd/lib';
import { CSSMotionProps } from 'rc-motion';
import { TSize } from '../../../models';
import * as React from 'react';
export declare namespace NTab {
    type TGetIndicatorSize = number | ((origin: number) => number);
    type TOnTabScroll = (info: {
        direction: 'left' | 'right' | 'top' | 'bottom';
    }) => void;
    type TTabPosition = 'left' | 'right' | 'top' | 'bottom';
    type TTabsType = 'line' | 'card' | 'editable-card';
    type TTabBarExtraPosition = 'left' | 'right';
    type TTabBarExtraMap = Partial<Record<TTabBarExtraPosition, React.ReactNode>>;
    type TabBarExtraContent = React.ReactNode | TTabBarExtraMap;
    type TAnimatedConfig = {
        inkBar?: boolean;
        tabPane?: boolean;
        tabPaneMotion?: CSSMotionProps;
    };
    type TTabsLocale = {
        addAriaLabel?: string;
        dropdownAriaLabel?: string;
        emptyText?: string;
        removeAriaLabel?: string;
    };
    type TTab = {
        key: string;
        label: React.ReactNode;
        tab?: React.ReactNode;
        className?: string;
        style?: React.CSSProperties;
        isDisabled?: boolean;
        children?: React.ReactNode;
        shouldForceRender?: boolean;
        isClosable?: boolean;
        closeIcon?: React.ReactNode;
        icon?: React.ReactNode;
        prefixCls?: string;
        tabKey?: string;
        id?: string;
        isAnimated?: boolean;
        isActive?: boolean;
        shouldDestroyInactiveTabPane?: boolean;
        hasBadge?: boolean;
        badgeCount?: number;
        extraNode?: {
            element: React.ReactNode;
            onHover?: boolean;
        };
    };
    export type TTabsLabelWrapper = {
        label: React.ReactNode;
        hasBadge?: boolean;
        isActiveTab?: boolean;
        badgeCount?: number;
        badgeUsedType: 'default' | 'primary';
        extraNode?: {
            element: React.ReactNode;
            onHover?: boolean;
        };
    };
    type TRenderTabBar = (props: TRenderTabBarProps, DefaultTabBar: React.ComponentType<TTabNavListProps>) => React.ReactElement;
    type TRenderTabBarProps = {
        id: string;
        activeKey: string;
        animated: TAnimatedConfig;
        tabPosition: TTabPosition;
        rtl: boolean;
        mobile: boolean;
        editable: TEditableConfig;
        locale: TTabsLocale;
        more: TMoreProps;
        tabBarGutter: number;
        onTabClick: (key: string, e: React.MouseEvent | React.KeyboardEvent) => void;
        onTabScroll: TOnTabScroll;
        extra: TabBarExtraContent;
        style: React.CSSProperties;
        /** @deprecated It do not pass real TabPane node. Only for compatible usage.  */
        panes: React.ReactNode;
    };
    type TTabNavListProps = {
        id: string;
        tabPosition: TTabPosition;
        activeKey: string;
        rtl: boolean;
        animated?: TAnimatedConfig;
        extra?: TabBarExtraContent;
        editable?: TEditableConfig;
        more?: TMoreProps;
        mobile: boolean;
        tabBarGutter?: number;
        renderTabBar?: TRenderTabBar;
        className?: string;
        style?: React.CSSProperties;
        locale?: TTabsLocale;
        onTabClick: (activeKey: string, e: React.MouseEvent | React.KeyboardEvent) => void;
        onTabScroll?: TOnTabScroll;
        children?: (node: React.ReactElement) => React.ReactElement;
        getPopupContainer?: (node: HTMLElement) => HTMLElement;
        popupClassName?: string;
        indicator?: {
            size?: TGetIndicatorSize;
            align?: 'start' | 'center' | 'end';
        };
    };
    export const TabNavList: React.ForwardRefExoticComponent<TTabNavListProps & React.RefAttributes<HTMLDivElement>>;
    type TEditableConfig = {
        onEdit: (type: 'add' | 'remove', info: {
            key?: string;
            event: React.MouseEvent | React.KeyboardEvent;
        }) => void;
        showAdd?: boolean;
        removeIcon?: React.ReactNode;
        addIcon?: React.ReactNode;
    };
    type TMoreProps = {
        icon?: TMoreIcon;
    } & Omit<DropdownProps, 'children'>;
    type TMoreIcon = React.ReactNode;
    export type TDraggableTabPaneProps = React.HTMLAttributes<HTMLDivElement> & {
        'data-node-key': string;
    };
    export type TProps = {
        /**
         * Префикс для CSS классов
         */
        prefixCls?: string;
        /**
         * CSS класс для компонента
         */
        className?: string;
        /**
         * Встроенные стили для компонента
         */
        style?: React.CSSProperties;
        /**
         * Идентификатор компонента
         */
        id?: string;
        /**
         * Массив вкладок
         */
        items?: TTab[];
        /**
         * Ключ текущей активной вкладки
         */
        activeKey?: string;
        /**
         * Ключ по умолчанию для активной вкладки
         */
        defaultActiveKey?: string;
        /**
         * Направление текста
         */
        direction?: 'ltr' | 'rtl';
        /**
         * Определяет, анимированы ли переходы между вкладками
         */
        isAnimated?: boolean | TAnimatedConfig;
        /**
         * Функция для пользовательского рендеринга панели вкладок
         */
        renderTabBar?: TRenderTabBar;
        /**
         * Дополнительный контент для отображения в панели вкладок
         */
        tabBarExtraContent?: TabBarExtraContent;
        /**
         * Расстояние между элементами в панели вкладок
         */
        tabBarGutter?: number;
        /**
         * Встроенные стили для панели вкладок
         */
        tabBarStyle?: React.CSSProperties;
        /**
         * Положение панели вкладок
         */
        tabPosition?: TTabPosition;
        /**
         * Определяет, уничтожать ли неактивные панели вкладок
         */
        shouldDestroyInactiveTabPane?: boolean;
        /**
         * Функция обратного вызова для события изменения вкладки
         */
        onChange?: (activeKey: string) => void;
        /**
         * Функция обратного вызова для события клика на вкладке
         */
        onTabClick?: (activeKey: string, e: React.KeyboardEvent | React.MouseEvent) => void;
        /**
         * Функция обратного вызова для события прокрутки вкладки
         */
        onTabScroll?: TOnTabScroll;
        /**
         * Функция для получения контейнера для всплывающих окон
         */
        getPopupContainer?: (node: HTMLElement) => HTMLElement;
        /**
         * Локализация компонента
         */
        locale?: TTabsLocale;
        /**
         * Пользовательская иконка для отображения дополнительных вкладок
         */
        moreIcon?: React.ReactNode;
        /**
         * Имя анимации для отображения дополнительных вкладок
         */
        moreTransitionName?: string;
        /**
         * CSS класс для всплывающего окна
         */
        popupClassName?: string;
        /**
         * Настройки индикатора вкладок
         */
        indicator?: {
            size?: TGetIndicatorSize;
            align?: 'start' | 'center' | 'end';
        };
        /**
         * CSS класс для корневого элемента
         */
        rootClassName?: string;
        /**
         * Тип вкладок
         */
        type?: TTabsType;
        /**
         * Размер вкладок
         */
        size?: TSize;
        /**
         * Определяет, скрывать ли кнопку "Добавить" для вкладок
         */
        shouldHideAdd?: boolean;
        /**
         * Определяет, будут ли вкладки выровнены по центру
         */
        isCentered?: boolean;
        /**
         * Пользовательская иконка для добавления вкладок
         */
        addIcon?: React.ReactNode;
        /**
         * Пользовательская иконка для удаления вкладок
         */
        removeIcon?: React.ReactNode;
        /**
         * Функция обратного вызова для событий редактирования вкладок
         */
        onEdit?: (e: React.MouseEvent | React.KeyboardEvent | string, action: 'add' | 'remove') => void;
        /**
         * Дочерние элементы React для рендеринга
         */
        children?: React.ReactNode;
    };
    export {};
}
