import { FormItemProps } from 'antd';
/**
 * Неймспейс с типизацией FormItem
 */
export declare namespace NFormItem {
    type TStatus = 'error' | 'warning' | '';
    type TProps = FormItemProps & {
        /**Отобразить звездочку обяазательности справа от лейбла */
        isRequiredRight?: boolean;
    };
}
