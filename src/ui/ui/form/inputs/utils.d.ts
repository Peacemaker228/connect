import { Mask } from 'react-text-mask';
/**
 * Конвертирует переданное значение согласно маске.
 * @param {string} value Значение.
 * @param {Mask | ((value: string) => Mask)} mask Маска.
 * @returns {string}
 */
export declare const conversionMaskedValue: (value: string | undefined, mask: Mask | ((value: string) => Mask)) => string;
