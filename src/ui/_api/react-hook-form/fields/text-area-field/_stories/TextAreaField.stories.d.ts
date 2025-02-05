import { Meta } from '@storybook/react';
import { NTextAreaField } from '../models';
import { TextAreaField } from '../TextAreaField';
declare const FIELD_NAME = "textarea";
type TForm = {
    [FIELD_NAME]: string;
};
declare const _default: Meta<typeof TextAreaField>;
export default _default;
export declare const DefaultTextAreaField: (props: NTextAreaField.TProps<TForm>) => import("react/jsx-runtime").JSX.Element;
export declare const ValidatedTextAreaField: {
    (props: NTextAreaField.TProps<TForm>): import("react/jsx-runtime").JSX.Element;
    args: {
        autosize: boolean;
        rules: {
            validate: (value: string) => "Поле должно содержать от 5 до 10 символов" | undefined;
        };
    };
};
