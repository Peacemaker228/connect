import { FC } from 'react';
import { FormItemProps } from 'antd';
type TProps = FormItemProps & {
    /**Отобразить звездочку обяазательности справа от лейбла */
    isRequiredRight?: boolean;
};
export declare const FormItem: FC<TProps>;
export {};
