import { Meta } from '@storybook/react';
import { NTimePickerField } from '../models';
import { TimePickerField } from '../TimePickerField';
declare const FIELD_NAME = "timePicker";
type TForm = {
    [FIELD_NAME]: string;
};
declare const _default: Meta<typeof TimePickerField>;
export default _default;
export declare const DefaultTimePickerField: (props: NTimePickerField.TProps<TForm>) => import("react/jsx-runtime").JSX.Element;
