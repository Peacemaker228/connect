import { ReactNode } from 'react';
import { NFileInput } from '../../form/file-input/models';
import { ModalProps } from '../common';
export interface ModalDocumentProps extends ModalProps {
    fileSettings?: NFileInput.TProps;
    descriptionFileModal?: ReactNode;
    titleFileModal?: ReactNode;
    iconFileModal?: ReactNode;
}
/**
 * Компонент модального окна.
 *
 * @param {ModalProps} props - Пропсы компонента.
 * */
export declare function ModalDocument(props: ModalDocumentProps): import("react/jsx-runtime").JSX.Element;
