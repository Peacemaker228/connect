import { NDropdown } from '../dropdown';
declare const meta: {
    title: string;
    args: {
        onOpenChange: import('@vitest/spy').Mock<(...args: any[]) => any>;
    };
    argTypes: {
        menu: {
            control: "object";
        };
        trigger: {
            control: "object";
        };
        isOpen: {
            control: "boolean";
        };
        placement: {
            control: "select";
            options: string[];
        };
        isDisabled: {
            control: "boolean";
        };
        onOpenChange: import('@vitest/spy').Mock<(...args: any[]) => any>;
    };
    component: import('react').FC<NDropdown.TProps>;
    parameters: {
        layout: string;
    };
    tags: string[];
};
export default meta;
export declare const Default: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NDropdown.TProps>;
export declare const DisabledElements: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NDropdown.TProps>;
export declare const OtherElements: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NDropdown.TProps>;
export declare const TriggerMode: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NDropdown.TProps>;
export declare const CascadingMode: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NDropdown.TProps>;
export declare const BadgeMode: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NDropdown.TProps>;
