import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { Popover } from '../Popover';
import { NPopover } from '../models';
declare const _default: Meta<typeof Popover>;
export default _default;
export declare const Default: {
    (argTypes: NPopover.TProps): ReactNode;
    args: {
        title: string;
        content: import("react/jsx-runtime").JSX.Element;
        children: import("react/jsx-runtime").JSX.Element;
    };
};
export declare const CustomTitle: {
    (argTypes: NPopover.TProps): ReactNode;
    args: {
        headerButton: import("react/jsx-runtime").JSX.Element;
        showHeaderButtons: boolean;
        isOpen: boolean;
        title: string;
        content: import("react/jsx-runtime").JSX.Element;
        children: import("react/jsx-runtime").JSX.Element;
    };
};
export declare const ShowCloseIcon: {
    (argTypes: NPopover.TProps): ReactNode;
    args: {
        showCloseIcon: boolean;
        trigger: string;
        children: import("react/jsx-runtime").JSX.Element;
        title: string;
        content: import("react/jsx-runtime").JSX.Element;
    };
};
export declare const Triggered: {
    (argTypes: NPopover.TProps): ReactNode;
    args: {
        trigger: string;
        children: import("react/jsx-runtime").JSX.Element;
        title: string;
        content: import("react/jsx-runtime").JSX.Element;
    };
};
export declare const Placements: {
    (argTypes: NPopover.TProps): ReactNode;
    args: {
        title: string;
        content: import("react/jsx-runtime").JSX.Element;
        children: import("react/jsx-runtime").JSX.Element;
    };
};
