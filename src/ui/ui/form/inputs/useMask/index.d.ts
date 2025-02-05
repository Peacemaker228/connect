import { UseMaskOptions } from './types.js';
/**
 * Хук для работы с маской ввода. Обеспечивает форматирование введённых данных
 * в соответствии с заданной маской, а также управляет позицией курсора.
 *
 * @param {UseMaskOptions} options - Параметры хука.
 * @param {Mask | ((value: string) => Mask)} options.mask - Маска ввода, представленная массивом строк и/или регулярных выражений.
 * Строки являются фиксированными символами, которые автоматически добавляются в значение.
 * Регулярные выражения определяют допустимые символы для ввода.
 * @param {string} [options.value=''] - Начальное значение, которое должно быть отформатировано по маске.
 *
 * @returns {Object} Результат работы хука.
 * @returns {string} maskedValue - Текущее отформатированное значение.
 * @returns {function} handleChange - Функция для обработки изменения ввода.
 * Принимает два параметра: значение ввода и текущую позицию курсора.
 * @returns {function} handleCursorChange - Функция для установки позиции курсора.
 * Принимает HTMLInputElement и обновляет позицию курсора в соответствии с маской.
 */
export declare function useMask({ mask, value }: UseMaskOptions): {
    maskedValue: string;
    handleChange: (inputValue: string, cursorPosition: number) => void;
    handleCursorChange: (input: HTMLInputElement) => void;
};
