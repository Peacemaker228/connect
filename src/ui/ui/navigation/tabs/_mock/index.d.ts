export declare const DEFAULT_ITEMS: {
    key: string;
    label: string;
    children: string;
}[];
export declare const WITH_BADGE_ITEMS: ({
    key: string;
    label: string;
    children: string;
    hasBadge: boolean;
    badgeCount: number;
} | {
    key: string;
    label: string;
    children: string;
    hasBadge: boolean;
    badgeCount?: undefined;
})[];
export declare const WITH_ICON_ITEMS: ({
    key: string;
    label: string;
    children: string;
    icon: import("react/jsx-runtime").JSX.Element;
} | {
    key: string;
    label: string;
    children: string;
    icon?: undefined;
})[];
export declare const WITH_EXTRA_ELEMENT_ITEMS: ({
    key: string;
    label: string;
    children: string;
    extraNode: {
        element: import("react/jsx-runtime").JSX.Element;
        onHover?: undefined;
    };
} | {
    key: string;
    label: string;
    children: string;
    extraNode: {
        element: import("react/jsx-runtime").JSX.Element;
        onHover: boolean;
    };
} | {
    key: string;
    label: string;
    children: string;
    extraNode?: undefined;
})[];
export declare const DRAGGABLE_TABS_ITEMS: {
    key: string;
    label: string;
    children: string;
}[];
