import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { Tabs } from '../../..';
import { NTab } from '../models';
declare const _default: Meta<typeof Tabs>;
export default _default;
export declare const Default: {
    (argTypes: NTab.TProps): ReactNode;
    args: {
        defaultActiveKey: string;
        direction: string;
        isAnimated: boolean;
        tabBarStyle: {
            width: string;
        };
        isCentered: boolean;
        items: {
            key: string;
            label: string;
            children: string;
        }[];
    };
};
export declare const WithBadge: {
    (argTypes: NTab.TProps): ReactNode;
    args: {
        items: ({
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
        defaultActiveKey: string;
        direction: string;
        isAnimated: boolean;
        tabBarStyle: {
            width: string;
        };
        isCentered: boolean;
    };
};
export declare const WithIndicatorCenter: {
    (argTypes: NTab.TProps): ReactNode;
    args: {
        indicator: {
            size: (origin: number) => number;
            align: string;
        };
        defaultActiveKey: string;
        direction: string;
        isAnimated: boolean;
        tabBarStyle: {
            width: string;
        };
        isCentered: boolean;
        items: {
            key: string;
            label: string;
            children: string;
        }[];
    };
};
export declare const WithCardType: {
    (argTypes: NTab.TProps): ReactNode;
    args: {
        type: string;
        defaultActiveKey: string;
        direction: string;
        isAnimated: boolean;
        tabBarStyle: {
            width: string;
        };
        isCentered: boolean;
        items: {
            key: string;
            label: string;
            children: string;
        }[];
    };
};
export declare const WithIcon: {
    (argTypes: NTab.TProps): ReactNode;
    args: {
        items: ({
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
        defaultActiveKey: string;
        direction: string;
        isAnimated: boolean;
        tabBarStyle: {
            width: string;
        };
        isCentered: boolean;
    };
};
export declare const WithExtraElement: {
    (argTypes: NTab.TProps): ReactNode;
    args: {
        isCentered: boolean;
        items: ({
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
        defaultActiveKey: string;
        direction: string;
        isAnimated: boolean;
        tabBarStyle: {
            width: string;
        };
    };
};
export declare const DraggableTabs: {
    (argTypes: NTab.TProps): ReactNode;
    args: {
        items: {
            key: string;
            label: string;
            children: string;
        }[];
        defaultActiveKey: string;
        direction: string;
        isAnimated: boolean;
        tabBarStyle: {
            width: string;
        };
        isCentered: boolean;
    };
};
