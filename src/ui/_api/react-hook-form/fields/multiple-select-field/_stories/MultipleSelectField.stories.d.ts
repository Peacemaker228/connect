import { Meta } from '@storybook/react';
import { NMultipleSelectField } from '../models';
import { MultipleSelectField } from '../MultipleSelectField';
declare const FIELD_NAME = "select";
type TForm = {
    [FIELD_NAME]: string;
};
declare const _default: Meta<typeof MultipleSelectField>;
export default _default;
export declare const DefaultNMultipleSelectField: (props: NMultipleSelectField.TProps<TForm>) => import("react/jsx-runtime").JSX.Element;
