import { TFloatAutoCompleteProps } from '../floatAutoComplete/models';
import { NAutoComplete } from '../models';
declare const meta: {
    title: string;
    component: import('react').FC<NAutoComplete.TProps>;
    parameters: {
        layout: string;
    };
    argTypes: {
        readonly style: {
            readonly control: "object";
        };
        readonly allowClear: {
            readonly control: "boolean";
        };
        readonly children: {
            readonly control: "object";
        };
        readonly isDefaultOpen: {
            readonly control: "boolean";
        };
        readonly defaultValue: {
            readonly control: "text";
        };
        readonly isDisabled: {
            readonly control: "boolean";
        };
        readonly popupClassName: {
            readonly control: "text";
        };
        readonly dropdownMatchSelectWidth: {
            readonly control: "object";
        };
        readonly notFoundContent: {
            readonly control: "object";
        };
        readonly isOpen: {
            readonly control: "boolean";
        };
        readonly placeholder: {
            readonly control: "text";
        };
        readonly status: {
            readonly control: "select";
            readonly options: readonly ["error", "warning", ""];
        };
        readonly variant: {
            readonly control: "select";
            readonly options: readonly ["outlined", "borderless", "filled"];
        };
    };
    args: {
        onBlur: import('@vitest/spy').Mock<(...args: any[]) => any>;
        onFocus: import('@vitest/spy').Mock<(...args: any[]) => any>;
        onChange: import('@vitest/spy').Mock<(...args: any[]) => any>;
        onSelect: import('@vitest/spy').Mock<(...args: any[]) => any>;
        onSearch: import('@vitest/spy').Mock<(...args: any[]) => any>;
        onDropdownVisibleChange: import('@vitest/spy').Mock<(...args: any[]) => any>;
    };
};
export default meta;
export declare const Default: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NAutoComplete.TProps>;
export declare const WithCustomPlaceholder: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NAutoComplete.TProps>;
export declare const WithDisabled: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NAutoComplete.TProps>;
export declare const WithCustomNotFoundText: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NAutoComplete.TProps>;
export declare const WithErrorState: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NAutoComplete.TProps>;
export declare const WithWarningState: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NAutoComplete.TProps>;
export declare const WithOpenByDefault: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, NAutoComplete.TProps>;
export declare const FloatAutoCompleteDefault: import('@storybook/csf').AnnotatedStoryFn<import('@storybook/react').ReactRenderer, TFloatAutoCompleteProps>;
