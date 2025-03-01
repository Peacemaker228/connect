import { NCheckbox } from '../models';
declare const meta: {
    title: string;
    component: import('react').FC<NCheckbox.TGroupProps<import('../../_common/models').TCheckboxValue>>;
    parameters: {
        layout: string;
    };
    argTypes: {
        options: {
            control: "object";
        };
        defaultValue: {
            control: "object";
        };
        isDisabled: {
            control: "boolean";
        };
        onChange: import('@vitest/spy').Mock<(...args: any[]) => any>;
    };
    args: {
        onChange: import('@vitest/spy').Mock<(...args: any[]) => any>;
    };
};
export default meta;
export declare const Default: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NCheckbox.TGroupProps<import('../../_common/models').TCheckboxValue>>;
export declare const Disabled: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NCheckbox.TGroupProps<import('../../_common/models').TCheckboxValue>>;
export declare const WithDefaultValue: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NCheckbox.TGroupProps<import('../../_common/models').TCheckboxValue>>;
