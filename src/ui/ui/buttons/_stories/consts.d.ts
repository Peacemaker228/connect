import { NButton } from '../models';
export declare const ARG_TYPES: {
    readonly children: {
        readonly control: "text";
    };
    readonly type: {
        readonly control: "select";
        readonly options: NButton.TButtonType[];
    };
    readonly icon: {
        readonly control: "select";
        readonly options: readonly ["none", "icon"];
        readonly mapping: {
            readonly none: null;
            readonly icon: import("react/jsx-runtime").JSX.Element;
        };
    };
    readonly size: {
        readonly control: "select";
        readonly options: NButton.TSize[];
    };
    readonly shape: {
        readonly control: "select";
        readonly options: NButton.TButtonShape[];
    };
    readonly isDisabled: {
        readonly control: "boolean";
    };
    readonly isLoading: {
        readonly control: "boolean";
    };
    readonly className: {
        readonly control: "text";
    };
    readonly title: {
        readonly control: "text";
    };
    readonly tooltip: {
        readonly control: "text";
    };
    readonly isBlock: {
        readonly control: "boolean";
    };
    readonly iconPosition: {
        readonly control: "select";
        readonly options: NButton.TIconPosition[];
    };
    readonly style: {
        readonly control: "object";
    };
    readonly 'data-*': {
        readonly control: "object";
    };
};
