import { default as React } from 'react';
import { NDropdownButton } from '../dropdown-button';
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
        size: {
            control: "select";
            options: string[];
        };
        type: {
            control: "select";
            options: string[];
        };
        placement: {
            control: "select";
            options: string[];
        };
        isLoading: {
            control: "boolean";
        };
        isDanger: {
            control: "boolean";
        };
        isOpen: {
            control: "boolean";
        };
        isDisabled: {
            control: "boolean";
        };
        onOpenChange: import('@vitest/spy').Mock<(...args: any[]) => any>;
    };
    component: React.FC<NDropdownButton.TProps>;
    parameters: {
        layout: string;
    };
    tags: string[];
};
export default meta;
export declare const Default: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NDropdownButton.TProps>;
export declare const DisabledButton: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NDropdownButton.TProps>;
export declare const DangerButton: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NDropdownButton.TProps>;
export declare const ButtonWithTooltip: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NDropdownButton.TProps>;
export declare const ButtonWithBadge: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NDropdownButton.TProps>;
