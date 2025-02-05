import { DragEvent } from 'react';
import { NFileInput } from '../../models';
export declare const DragAndDrop: {
    (argTypes: NFileInput.TProps): import("react/jsx-runtime").JSX.Element;
    args: {
        name: string;
        multiple: boolean;
        action: string;
        onChange: (info: NFileInput.TUploadChangeParam<NFileInput.TUploadFile>) => void;
        onDrop(e: DragEvent): void;
    };
};
