import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { Collapse, NCollapse } from '../collapse';
declare const _default: Meta<typeof Collapse>;
export default _default;
export declare const Default: (argTypes: NCollapse.TProps) => ReactNode;
export declare const WithSomeOpened: {
    (argTypes: NCollapse.TProps): ReactNode;
    args: {
        defaultActiveKey: string[];
    };
};
export declare const SizeVariants: (argTypes: NCollapse.TProps) => ReactNode;
export declare const IsGhost: {
    (argTypes: NCollapse.TProps): ReactNode;
    args: {
        isGhost: boolean;
    };
};
export declare const Collapsible: {
    (argTypes: NCollapse.TProps): ReactNode;
    args: {
        collapsible: string;
    };
};
export declare const ShowArrow: (argTypes: NCollapse.TProps) => ReactNode;
export declare const ExtraArrow: (argTypes: NCollapse.TProps) => ReactNode;
export declare const Embedded: {
    (argTypes: NCollapse.TProps): ReactNode;
    args: {
        isOutline: boolean;
    };
};
