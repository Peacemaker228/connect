import { Meta } from '@storybook/react';
import { CheckboxField } from '../CheckboxField';
import { NCheckboxField } from '../models';
declare const FIELD_NAME = "checkbox";
type TForm = {
    [FIELD_NAME]: string;
};
declare const _default: Meta<typeof CheckboxField>;
export default _default;
export declare const DefaultCheckboxField: (props: NCheckboxField.TProps<TForm>) => import("react/jsx-runtime").JSX.Element;
