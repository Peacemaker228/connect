import { ReactNode } from 'react';
import { NTag } from '../models';
export interface TagIcon {
    icon: ReactNode;
    text: string;
    color?: NTag.TTagPresetColor;
}
export interface TagBorderless extends Omit<TagIcon, 'icon'> {
    icon?: ReactNode;
    isClosable?: boolean;
}
