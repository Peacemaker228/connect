import { NCheckbox } from '../models';
declare const meta: {
    title: string;
    component: import('react').FC<NCheckbox.TProps>;
    parameters: {
        layout: string;
    };
    argTypes: {
        isDisabled: {
            control: "boolean";
        };
        isChecked: {
            control: "boolean";
        };
        name: {
            control: "text";
        };
    };
    args: {
        onChange: import('@vitest/spy').Mock<(...args: any[]) => any>;
    };
};
export default meta;
export declare const Default: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NCheckbox.TProps>;
export declare const Checked: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NCheckbox.TProps>;
export declare const Disabled: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NCheckbox.TProps>;
