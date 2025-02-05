import { ReactNode } from 'react';
import { Card } from '../Card';
import { NCard } from '../model';
declare const meta: {
    title: string;
    component: typeof Card;
    parameters: {
        layout: string;
    };
    argTypes: {
        title: {
            control: "text";
        };
        extra: {
            control: "text";
        };
        style: {
            control: "object";
        };
        isBordered: {
            control: "boolean";
        };
        isInner: {
            control: "boolean";
        };
        isLoading: {
            control: "boolean";
        };
        size: {
            control: "select";
            options: string[];
        };
        children: {
            control: "object";
        };
    };
    tags: string[];
};
export default meta;
export declare const Default: {
    (argTypes: NCard.TProps): ReactNode;
    args: {
        extra: import("react/jsx-runtime").JSX.Element;
        style: {
            width: number;
        };
    };
};
export declare const NoBorder: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NCard.TProps>;
export declare const SimpleCard: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NCard.TProps>;
export declare const CustomContent: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NCard.TProps>;
export declare const Loading: {
    (argTypes: NCard.TProps): ReactNode;
    args: {
        style: {
            width: number;
            marginTop: number;
        };
        isLoading: boolean;
    };
};
export declare const Grid: {
    (argTypes: NCard.TProps): ReactNode;
    args: {
        title: string;
        style: {
            width: string;
            textAlign: string;
        };
    };
};
export declare const Inner: () => ReactNode;
export declare const InnerStyle: {
    (argTypes: NCard.TProps): ReactNode;
    args: {
        title: string;
        style: {
            width: number;
        };
        isInnerStyle: boolean;
        extra: import("react/jsx-runtime").JSX.Element;
    };
};
