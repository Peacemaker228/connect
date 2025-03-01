import { Meta } from '@storybook/react';
import { DatePickerField } from '../DatePickerField';
import { NDatePickerField } from '../models';
declare const FIELD_NAME = "datePicker";
type TForm = {
    [FIELD_NAME]: string;
};
declare const _default: Meta<typeof DatePickerField>;
export default _default;
export declare const DefaultDatePickerField: (props: NDatePickerField.TProps<TForm>) => import("react/jsx-runtime").JSX.Element;
