import { EPicker } from '../../_common/models';
export declare const ARG_TYPES: {
    readonly isLoading: {
        readonly control: "boolean";
    };
    readonly allowClear: {
        readonly control: "boolean";
    };
    readonly autoFocus: {
        readonly control: "boolean";
    };
    readonly className: {
        readonly control: "text";
    };
    readonly format: {
        readonly control: "text";
    };
    readonly isDisabled: {
        readonly control: "boolean";
    };
    readonly isDisabledDate: {
        readonly control: false;
    };
    readonly isOpen: {
        readonly control: "boolean";
    };
    readonly isReadonly: {
        readonly control: "boolean";
    };
    readonly locale: {
        readonly control: "select";
        readonly options: readonly ["en", "ru", "es", "fr", "de"];
    };
    readonly minDate: {
        readonly control: "date";
    };
    readonly maxDate: {
        readonly control: "date";
    };
    readonly mode: {
        readonly control: "select";
        readonly options: readonly ["date", "month", "year"];
    };
    readonly needConfirm: {
        readonly control: "boolean";
    };
    readonly picker: {
        readonly control: "select";
        readonly options: EPicker[];
    };
    readonly placeholder: {
        readonly control: "text";
    };
    readonly placement: {
        readonly control: "select";
        readonly options: readonly ["bottomLeft", "bottomRight", "topLeft", "topRight"];
    };
    readonly size: {
        readonly control: "select";
        readonly options: readonly ["small", "middle", "large"];
    };
    readonly status: {
        readonly control: "select";
        readonly options: readonly ["error", "warning", "success", "info"];
    };
    readonly variant: {
        readonly control: "select";
        readonly options: readonly ["outlined", "filled", "standard"];
    };
};
export declare const DEFAULT_ARGS: {
    onChange: import('@vitest/spy').Mock<(...args: any[]) => any>;
    onOk: import('@vitest/spy').Mock<(...args: any[]) => any>;
};
