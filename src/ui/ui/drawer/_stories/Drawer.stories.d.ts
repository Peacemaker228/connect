import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { Drawer } from '../Drawer';
import { NDrawer } from '../models';
declare const _default: Meta<typeof Drawer>;
export default _default;
export declare const DefaultDrawer: {
    (argTypes: NDrawer.TProps): ReactNode;
    args: {
        title: string;
        isDestroyOnClose: boolean;
        size: string;
        isResizable: boolean;
        placement: string;
        withDefaultFooter: boolean;
    };
};
export declare const DrawerPlacements: {
    (argTypes: NDrawer.TProps): ReactNode;
    args: {
        title: string;
        isDestroyOnClose: boolean;
        size: string;
        isResizable: boolean;
        placement: string;
        withDefaultFooter: boolean;
    };
};
export declare const LoadingDrawer: {
    (argTypes: NDrawer.TProps): ReactNode;
    args: {
        isLoading: boolean;
        title: string;
        isDestroyOnClose: boolean;
        size: string;
        isResizable: boolean;
        placement: string;
        withDefaultFooter: boolean;
    };
};
export declare const CustomHeader: {
    (argTypes: NDrawer.TProps): ReactNode;
    args: {
        extra: import("react/jsx-runtime").JSX.Element;
        title: string;
        isDestroyOnClose: boolean;
        size: string;
        isResizable: boolean;
        placement: string;
        withDefaultFooter: boolean;
    };
};
export declare const DrawerWithoutFooter: {
    (argTypes: NDrawer.TProps): ReactNode;
    args: {
        withDefaultFooter: boolean;
        title: string;
        isDestroyOnClose: boolean;
        size: string;
        isResizable: boolean;
        placement: string;
    };
};
export declare const CustomedDefaultFooter: {
    (argTypes: NDrawer.TProps): ReactNode;
    args: {
        defaultFooterProps: {
            cancelBtnText: string;
            acceptBtnText: string;
            onAccept: () => void;
        };
        title: string;
        isDestroyOnClose: boolean;
        size: string;
        isResizable: boolean;
        placement: string;
        withDefaultFooter: boolean;
    };
};
export declare const CustomFooter: {
    (argTypes: NDrawer.TProps): ReactNode;
    args: {
        title: string;
        isDestroyOnClose: boolean;
        size: string;
        isResizable: boolean;
        placement: string;
        customFooter: import("react/jsx-runtime").JSX.Element;
    };
};
