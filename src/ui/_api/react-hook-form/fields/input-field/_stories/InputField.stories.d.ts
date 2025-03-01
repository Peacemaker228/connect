import { Meta } from '@storybook/react';
import { InputField } from '../InputField';
import { NInputField } from '../models';
declare const FIELD_NAME = "input";
type TForm = {
    [FIELD_NAME]: string;
};
declare const _default: Meta<typeof InputField>;
export default _default;
export declare const DefaultInputField: (props: NInputField.TProps<TForm>) => import("react/jsx-runtime").JSX.Element;
export declare const NumberInputField: {
    (props: NInputField.TProps<TForm>): import("react/jsx-runtime").JSX.Element;
    args: {
        type: string;
    };
};
export declare const ValidatedInputField: {
    (props: NInputField.TProps<TForm>): import("react/jsx-runtime").JSX.Element;
    args: {
        autosize: boolean;
        rules: {
            required: boolean;
            validate: (value: string) => "Поле должно содержать от 5 до 10 символов" | undefined;
        };
    };
};
export declare const RequiredRightInputField: {
    (props: NInputField.TProps<TForm>): import("react/jsx-runtime").JSX.Element;
    args: {
        autosize: boolean;
        isRequiredRight: boolean;
        rules: {
            required: boolean;
            validate: (value: string) => "Поле должно содержать от 5 до 10 символов" | undefined;
        };
    };
};
