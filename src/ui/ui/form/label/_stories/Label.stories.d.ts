import { NLabel } from '../models';
declare const meta: {
    title: string;
    component: import('react').FC<NLabel.TProps>;
    parameters: {
        layout: string;
    };
    argTypes: {
        title: {
            control: "text";
        };
        children: {
            control: "text";
        };
        isDisabled: {
            control: "boolean";
        };
        isStrong: {
            control: "boolean";
        };
        isUnderline: {
            control: "boolean";
        };
        isItalic: {
            control: "boolean";
        };
    };
    args: {};
};
export default meta;
export declare const Default: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NLabel.TProps>;
export declare const Disabled: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NLabel.TProps>;
export declare const Strong: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NLabel.TProps>;
export declare const Underlined: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NLabel.TProps>;
export declare const Italic: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NLabel.TProps>;
