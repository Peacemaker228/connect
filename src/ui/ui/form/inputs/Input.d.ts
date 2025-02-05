import { default as React } from 'react';
import { InputRef } from 'antd';
import { NInput } from './models';
/**
 * Поле формы (обертка поля из Ant Design)
 */
export declare const InputComponent: ({ placeholder, ...props }: NInput.TProps, ref: React.LegacyRef<InputRef>) => import("react/jsx-runtime").JSX.Element;
export declare const Input: React.ForwardRefExoticComponent<Omit<NInput.TProps, "ref"> & React.RefAttributes<InputRef>>;
