import { NBreadcrumb } from '../models';
export declare const DEFAULT_ITEMS: {
    title: string;
}[];
export declare const WITH_ICON_ITEMS: ({
    href: string;
    icon: import("react/jsx-runtime").JSX.Element;
    title?: undefined;
} | {
    href: string;
    title: string;
    icon: import("react/jsx-runtime").JSX.Element;
} | {
    title: string;
    href?: undefined;
    icon?: undefined;
})[];
export declare const WITH_MENU_ITEMS: ({
    title: string;
    menu?: undefined;
} | {
    title: string;
    menu: {
        items: {
            key: string;
            label: import("react/jsx-runtime").JSX.Element;
        }[];
    };
})[];
export declare const INDEPENDENT_SEPARATOR: NBreadcrumb.TItem[];
