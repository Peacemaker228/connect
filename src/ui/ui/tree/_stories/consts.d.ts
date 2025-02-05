import { TreeDataNode } from 'antd';
export declare const BASIC_TREE_DATA: TreeDataNode[];
export declare const ICON_TREE_DATA: TreeDataNode[];
export declare const CUSTOM_TITLE_DATA: TreeDataNode[];
export declare const TREE_SELECT_DATA: ({
    title: string;
    value: string;
    key: string;
    children: {
        title: string;
        value: string;
        key: string;
        children: {
            title: string;
            value: string;
            key: string;
        }[];
    }[];
} | {
    title: string;
    value: string;
    key: string;
    children: {
        title: string;
        value: string;
        key: string;
    }[];
})[];
export declare const TREE_SELECT_MANY_DATA: {
    title: string;
    value: string;
    key: string;
    children: {
        title: string;
        value: string;
        key: string;
    }[];
}[];
export declare const TREE_SELECT_SUBTITLE_DATA: ({
    label: string;
    subLabel: string;
    value: string;
    key: string;
    children: {
        title: string;
        value: string;
        key: string;
        label: string;
        subLabel: string;
        iconLabel: import("react/jsx-runtime").JSX.Element;
        children: {
            title: string;
            value: string;
            key: string;
            iconLabel: import("react/jsx-runtime").JSX.Element;
            label: string;
            subLabel: string;
        }[];
    }[];
} | {
    value: string;
    label: string;
    subLabel: string;
    key: string;
    children: {
        title: string;
        value: string;
        key: string;
        iconLabel: import("react/jsx-runtime").JSX.Element;
        label: string;
        subLabel: string;
        titlePopup: string;
    }[];
})[];
export declare const OPTIONS_SELECT_ICON: {
    value: string;
    label: import("react/jsx-runtime").JSX.Element;
    labelRender: import("react/jsx-runtime").JSX.Element;
}[];
