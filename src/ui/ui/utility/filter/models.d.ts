import { NTag } from '../tag';
export declare namespace NFilter {
    type TProps = Omit<NTag.TProps, 'children'> & {
        /**
         * Название фильтра
         */
        label?: string;
        /**
         * Значения фильтра
         */
        items: string[];
        /**
         * Максимальная длина фильтра
         */
        controlMaxWidth?: number;
    };
}
