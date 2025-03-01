export declare const ARG_TYPES: {
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
    readonly popupClassName: {
        readonly control: "text";
    };
    readonly preserveInvalidOnBlur: {
        readonly control: "boolean";
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
        readonly control: "object";
    };
    readonly minDate: {
        readonly control: "date";
    };
    readonly maxDate: {
        readonly control: "date";
    };
    readonly mode: {
        readonly control: "select";
        readonly options: readonly ["time", "date", "month", "year", "decade"];
    };
    readonly needConfirm: {
        readonly control: "boolean";
    };
    readonly nextIcon: {
        readonly control: "text";
    };
    readonly panelRender: {
        readonly control: false;
    };
    readonly picker: {
        readonly control: "select";
        readonly options: readonly ["date", "week", "month", "quarter", "year"];
    };
    readonly placeholder: {
        readonly control: "text";
    };
    readonly placement: {
        readonly control: "select";
        readonly options: readonly ["topLeft", "topRight", "bottomLeft", "bottomRight"];
    };
    readonly popupStyle: {
        readonly control: "object";
    };
    readonly prevIcon: {
        readonly control: "text";
    };
    readonly size: {
        readonly control: "select";
        readonly options: readonly ["small", "middle", "large"];
    };
    readonly status: {
        readonly control: "select";
        readonly options: readonly ["error", "warning"];
    };
    readonly style: {
        readonly control: "object";
    };
    readonly suffixIcon: {
        readonly control: "text";
    };
    readonly superNextIcon: {
        readonly control: "text";
    };
    readonly superPrevIcon: {
        readonly control: "text";
    };
    readonly variant: {
        readonly control: "select";
        readonly options: readonly ["default", "filled", "outlined"];
    };
    readonly onOpenChange: {
        readonly control: false;
    };
    readonly onPanelChange: {
        readonly control: false;
    };
    readonly allowEmpty: {
        readonly control: "object";
    };
    readonly defaultPickerValue: {
        readonly control: "date";
    };
    readonly defaultValue: {
        readonly control: "object";
    };
    readonly id: {
        readonly control: "object";
    };
    readonly pickerValue: {
        readonly control: "date";
    };
    readonly presets: {
        readonly control: "object";
    };
    readonly renderExtraFooter: {
        readonly control: false;
    };
    readonly separator: {
        readonly control: "text";
    };
    readonly value: {
        readonly control: "object";
    };
};
export declare const DEFAULT_ARGS: {
    onCalendarChange: import('@vitest/spy').Mock<(...args: any[]) => any>;
    onChange: import('@vitest/spy').Mock<(...args: any[]) => any>;
    onFocus: import('@vitest/spy').Mock<(...args: any[]) => any>;
    onBlur: import('@vitest/spy').Mock<(...args: any[]) => any>;
};
