import { ReactNode } from 'react';
import { TSize } from '../../../models';
import { NDropdown } from '../dropdown';
export declare namespace NDropdownButton {
    type TType = 'default' | 'primary' | 'dashed' | 'link' | 'text';
    type TAdjustOverflow = NDropdown.TAdjustOverflow;
    type TDropdownArrowOptions = NDropdown.TDropdownArrowOptions;
    type TProps = NDropdown.TProps & {
        /**
         * Пользовательские кнопки внутри комопнента
         */
        buttonsRender?: (buttons: React.ReactNode[]) => React.ReactNode[];
        isLoading?: boolean | {
            delay: number;
        };
        isDanger?: boolean;
        icon?: ReactNode;
        /**
         * Иконка кнопки. Слева.
         */
        iconBtn?: ReactNode;
        size?: TSize;
        type?: TType;
        onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
    };
}
