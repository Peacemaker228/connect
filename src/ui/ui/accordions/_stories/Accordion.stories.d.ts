import { ReactNode } from 'react';
import { Meta } from '@storybook/react';
import { Accordion, NAccordion } from '../accordion';
declare const _default: Meta<typeof Accordion>;
export default _default;
export declare const Default: {
    (argTypes: NAccordion.TProps): ReactNode;
    args: {
        defaultActiveKey: string[];
    };
};
export declare const SizeVariants: {
    (argTypes: NAccordion.TProps): ReactNode;
    args: {
        defaultActiveKey: string[];
    };
};
export declare const IsGhost: {
    (argTypes: NAccordion.TProps): ReactNode;
    args: {
        isGhost: boolean;
        defaultActiveKey: string[];
    };
};
export declare const Collapsible: {
    (argTypes: NAccordion.TProps): ReactNode;
    args: {
        collapsible: string;
        defaultActiveKey: string[];
    };
};
export declare const ShowArrow: {
    (argTypes: NAccordion.TProps): ReactNode;
    args: {
        defaultActiveKey: string[];
    };
};
