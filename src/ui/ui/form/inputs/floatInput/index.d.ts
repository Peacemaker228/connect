import { default as React } from 'react';
import { NInput } from '../../..';
interface FloatInputRef {
    input: HTMLInputElement | null;
}
export declare const FloatInput: React.ForwardRefExoticComponent<Omit<NInput.TProps, "ref"> & React.RefAttributes<FloatInputRef>>;
export {};
