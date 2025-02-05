import { Meta } from '@storybook/react';
import { NRangePickerField } from '../models';
import { RangePickerField } from '../RangePickerField';
declare const FIELD_NAME = "rangePicker";
type TForm = {
    [FIELD_NAME]: string;
};
declare const _default: Meta<typeof RangePickerField>;
export default _default;
export declare const DefaultRangePickerField: (props: NRangePickerField.TProps<TForm>) => import("react/jsx-runtime").JSX.Element;
