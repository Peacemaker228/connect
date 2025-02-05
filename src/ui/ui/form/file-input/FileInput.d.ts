import { NFileInput } from './models';
export declare function FileInput({ shouldShowUploadList, shouldOpenFileDialogOnClick, isMultiple, isDisabled, isDirectory, ...restProps }: NFileInput.TProps): import("react/jsx-runtime").JSX.Element;
export declare namespace FileInput {
    var Dragger: typeof FileInputDragger;
    var LIST_IGNORE: string;
}
export declare function FileInputDragger({ shouldShowUploadList, shouldOpenFileDialogOnClick, isMultiple, isDisabled, isDirectory, ...restProps }: NFileInput.TProps): import("react/jsx-runtime").JSX.Element;
