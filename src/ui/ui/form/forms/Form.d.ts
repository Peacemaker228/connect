import { ReactNode } from 'react';
import { FormProps } from 'antd';
import { FormLayout } from 'antd/es/form/Form';
/**
 * @property {FormLayout} [layout] - Тип шаблона формы
 * @property {ReactNode} [children] - Контент формы
 * */
type TProps = FormProps & {
    layout: FormLayout;
    children?: ReactNode;
};
/**
 * Форма (обертка формы из Ant Design)
 */
declare function Form(props: TProps): import("react/jsx-runtime").JSX.Element;
declare namespace Form {
    var useForm: typeof import("antd/es/form/Form").useForm;
}
export { Form };
