import { default as React, Key, MouseEventHandler, ReactNode } from 'react';
import { AnyObject } from '../..';
import { NDropdown } from '../../dropdown/dropdown';
/**
 * Неймспейс с типизацией Breadcrumb
 */
export declare namespace NBreadcrumb {
    export type TMenuItem = {
        key?: Key;
        title?: ReactNode;
        label?: ReactNode;
        path?: string;
        href?: string;
    };
    type TMenu = NonNullable<NDropdown.TProps['menu']>;
    type TBreadcrumbItem = {
        key?: Key;
        /**
         * Отличается от `path`. Прямо устанавливает ссылку для этого элемента.
         */
        href?: string;
        /**
         * Отличается от `href`. Он будет объединять все предыдущие `path` с текущим.
         */
        path?: string;
        title?: ReactNode;
        breadcrumbName?: string;
        menu?: Omit<TMenu, 'items'> & {
            items?: TMenuItem[];
        };
        className?: string;
        dropdownProps?: NDropdown.TProps;
        onClick?: MouseEventHandler<HTMLAnchorElement | HTMLSpanElement>;
        /**
         * Иконка для крошек
         */
        icon?: React.ReactNode;
    };
    type TBreadcrumbSeparator = {
        type: 'separator';
        separator?: ReactNode;
    };
    export type TItem = Partial<TBreadcrumbItem & TBreadcrumbSeparator>;
    type TItemRender<T> = (route: TItem, params: T, routes: TItem[], paths: string[]) => ReactNode;
    export type TProps<T extends AnyObject = AnyObject> = {
        /**
         * Кастомный рендеринг маршрутизации
         */
        itemRender?: TItemRender<T>;
        /**
         * Элементы маршрутизации
         */
        items?: TItem[];
        /**
         * Параметры маршрутизации
         */
        params?: T;
        /**
         * Разделитель медлу элементами
         */
        separator?: React.ReactNode;
        /**
         * Отображать тайтл в крошках
         */
        isLastCrumbTitle?: boolean;
    };
    export {};
}
