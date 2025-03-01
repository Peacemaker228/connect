import { Meta } from '@storybook/react';
import { MaskedInputField } from '../MaskedInputField';
import { NMaskedInputField } from '../models';
declare const FIELD_NAME = "input";
type TForm = {
    [FIELD_NAME]: string;
};
declare const _default: Meta<typeof MaskedInputField>;
export default _default;
export declare const DefaultMaskedInputField: (props: NMaskedInputField.TProps<TForm>) => import("react/jsx-runtime").JSX.Element;
export declare const ValidatedMaskedInputField: {
    (props: NMaskedInputField.TProps<TForm>): import("react/jsx-runtime").JSX.Element;
    args: {
        tooltip: string;
        rules: {
            required: boolean;
            validate: (value: string) => "Поле должно содержать 6 символов" | undefined;
        };
    };
};
