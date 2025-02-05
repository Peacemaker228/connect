var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: !0 });
import { by as jsxRuntimeExports, c9 as FormItem, cf as Checkbox, c5 as DatePicker, ca as Input, cb as MaskedInput, cd as MultipleSelect, c6 as RangePicker, bK as Select, ce as TextArea, c7 as TimePicker } from "./Table-DcTjJ9Nx.js";
import React__default from "react";
import "react-dom";
var isCheckBoxInput = /* @__PURE__ */ __name((element) => element.type === "checkbox", "isCheckBoxInput"), isDateObject = /* @__PURE__ */ __name((value) => value instanceof Date, "isDateObject"), isNullOrUndefined = /* @__PURE__ */ __name((value) => value == null, "isNullOrUndefined");
const isObjectType = /* @__PURE__ */ __name((value) => typeof value == "object", "isObjectType");
var isObject = /* @__PURE__ */ __name((value) => !isNullOrUndefined(value) && !Array.isArray(value) && isObjectType(value) && !isDateObject(value), "isObject"), getEventValue = /* @__PURE__ */ __name((event) => isObject(event) && event.target ? isCheckBoxInput(event.target) ? event.target.checked : event.target.value : event, "getEventValue"), getNodeParentName = /* @__PURE__ */ __name((name) => name.substring(0, name.search(/\.\d+(\.|$)/)) || name, "getNodeParentName"), isNameInFieldArray = /* @__PURE__ */ __name((names, name) => names.has(getNodeParentName(name)), "isNameInFieldArray"), isPlainObject = /* @__PURE__ */ __name((tempObject) => {
  const prototypeCopy = tempObject.constructor && tempObject.constructor.prototype;
  return isObject(prototypeCopy) && prototypeCopy.hasOwnProperty("isPrototypeOf");
}, "isPlainObject"), isWeb = typeof window < "u" && typeof window.HTMLElement < "u" && typeof document < "u";
function cloneObject(data) {
  let copy;
  const isArray = Array.isArray(data), isFileListInstance = typeof FileList < "u" ? data instanceof FileList : !1;
  if (data instanceof Date)
    copy = new Date(data);
  else if (data instanceof Set)
    copy = new Set(data);
  else if (!(isWeb && (data instanceof Blob || isFileListInstance)) && (isArray || isObject(data)))
    if (copy = isArray ? [] : {}, !isArray && !isPlainObject(data))
      copy = data;
    else
      for (const key in data)
        data.hasOwnProperty(key) && (copy[key] = cloneObject(data[key]));
  else
    return data;
  return copy;
}
__name(cloneObject, "cloneObject");
var compact = /* @__PURE__ */ __name((value) => Array.isArray(value) ? value.filter(Boolean) : [], "compact"), isUndefined = /* @__PURE__ */ __name((val) => val === void 0, "isUndefined"), get = /* @__PURE__ */ __name((object, path, defaultValue) => {
  if (!path || !isObject(object))
    return defaultValue;
  const result = compact(path.split(/[,[\].]+?/)).reduce((result2, key) => isNullOrUndefined(result2) ? result2 : result2[key], object);
  return isUndefined(result) || result === object ? isUndefined(object[path]) ? defaultValue : object[path] : result;
}, "get"), isBoolean = /* @__PURE__ */ __name((value) => typeof value == "boolean", "isBoolean"), isKey = /* @__PURE__ */ __name((value) => /^\w*$/.test(value), "isKey"), stringToPath = /* @__PURE__ */ __name((input) => compact(input.replace(/["|']|\]/g, "").split(/\.|\[/)), "stringToPath"), set = /* @__PURE__ */ __name((object, path, value) => {
  let index = -1;
  const tempPath = isKey(path) ? [path] : stringToPath(path), length = tempPath.length, lastIndex = length - 1;
  for (; ++index < length; ) {
    const key = tempPath[index];
    let newValue = value;
    if (index !== lastIndex) {
      const objValue = object[key];
      newValue = isObject(objValue) || Array.isArray(objValue) ? objValue : isNaN(+tempPath[index + 1]) ? {} : [];
    }
    if (key === "__proto__" || key === "constructor" || key === "prototype")
      return;
    object[key] = newValue, object = object[key];
  }
  return object;
}, "set");
const EVENTS = {
  BLUR: "blur",
  FOCUS_OUT: "focusout",
  CHANGE: "change"
}, VALIDATION_MODE = {
  onBlur: "onBlur",
  onChange: "onChange",
  onSubmit: "onSubmit",
  onTouched: "onTouched",
  all: "all"
}, HookFormContext = React__default.createContext(null), useFormContext = /* @__PURE__ */ __name(() => React__default.useContext(HookFormContext), "useFormContext");
var getProxyFormState = /* @__PURE__ */ __name((formState, control, localProxyFormState, isRoot = !0) => {
  const result = {
    defaultValues: control._defaultValues
  };
  for (const key in formState)
    Object.defineProperty(result, key, {
      get: /* @__PURE__ */ __name(() => {
        const _key = key;
        return control._proxyFormState[_key] !== VALIDATION_MODE.all && (control._proxyFormState[_key] = !isRoot || VALIDATION_MODE.all), localProxyFormState && (localProxyFormState[_key] = !0), formState[_key];
      }, "get")
    });
  return result;
}, "getProxyFormState"), isEmptyObject = /* @__PURE__ */ __name((value) => isObject(value) && !Object.keys(value).length, "isEmptyObject"), shouldRenderFormState = /* @__PURE__ */ __name((formStateData, _proxyFormState, updateFormState, isRoot) => {
  updateFormState(formStateData);
  const { name, ...formState } = formStateData;
  return isEmptyObject(formState) || Object.keys(formState).length >= Object.keys(_proxyFormState).length || Object.keys(formState).find((key) => _proxyFormState[key] === !0);
}, "shouldRenderFormState"), convertToArrayPayload = /* @__PURE__ */ __name((value) => Array.isArray(value) ? value : [value], "convertToArrayPayload"), shouldSubscribeByName = /* @__PURE__ */ __name((name, signalName, exact) => !name || !signalName || name === signalName || convertToArrayPayload(name).some((currentName) => currentName && (exact ? currentName === signalName : currentName.startsWith(signalName) || signalName.startsWith(currentName))), "shouldSubscribeByName");
function useSubscribe(props) {
  const _props = React__default.useRef(props);
  _props.current = props, React__default.useEffect(() => {
    const subscription = !props.disabled && _props.current.subject && _props.current.subject.subscribe({
      next: _props.current.next
    });
    return () => {
      subscription && subscription.unsubscribe();
    };
  }, [props.disabled]);
}
__name(useSubscribe, "useSubscribe");
function useFormState(props) {
  const methods = useFormContext(), { control = methods.control, disabled, name, exact } = props, [formState, updateFormState] = React__default.useState(control._formState), _mounted = React__default.useRef(!0), _localProxyFormState = React__default.useRef({
    isDirty: !1,
    isLoading: !1,
    dirtyFields: !1,
    touchedFields: !1,
    validatingFields: !1,
    isValidating: !1,
    isValid: !1,
    errors: !1
  }), _name = React__default.useRef(name);
  return _name.current = name, useSubscribe({
    disabled,
    next: /* @__PURE__ */ __name((value) => _mounted.current && shouldSubscribeByName(_name.current, value.name, exact) && shouldRenderFormState(value, _localProxyFormState.current, control._updateFormState) && updateFormState({
      ...control._formState,
      ...value
    }), "next"),
    subject: control._subjects.state
  }), React__default.useEffect(() => (_mounted.current = !0, _localProxyFormState.current.isValid && control._updateValid(!0), () => {
    _mounted.current = !1;
  }), [control]), React__default.useMemo(() => getProxyFormState(formState, control, _localProxyFormState.current, !1), [formState, control]);
}
__name(useFormState, "useFormState");
var isString = /* @__PURE__ */ __name((value) => typeof value == "string", "isString"), generateWatchOutput = /* @__PURE__ */ __name((names, _names, formValues, isGlobal, defaultValue) => isString(names) ? get(formValues, names, defaultValue) : Array.isArray(names) ? names.map((fieldName) => get(formValues, fieldName)) : formValues, "generateWatchOutput");
function useWatch(props) {
  const methods = useFormContext(), { control = methods.control, name, defaultValue, disabled, exact } = props, _name = React__default.useRef(name);
  _name.current = name, useSubscribe({
    disabled,
    subject: control._subjects.values,
    next: /* @__PURE__ */ __name((formState) => {
      shouldSubscribeByName(_name.current, formState.name, exact) && updateValue(cloneObject(generateWatchOutput(_name.current, control._names, formState.values || control._formValues, !1, defaultValue)));
    }, "next")
  });
  const [value, updateValue] = React__default.useState(control._getWatch(name, defaultValue));
  return React__default.useEffect(() => control._removeUnmounted()), value;
}
__name(useWatch, "useWatch");
function useController(props) {
  const methods = useFormContext(), { name, disabled, control = methods.control, shouldUnregister } = props, isArrayField = isNameInFieldArray(control._names.array, name), value = useWatch({
    control,
    name,
    defaultValue: get(control._formValues, name, get(control._defaultValues, name, props.defaultValue)),
    exact: !0
  }), formState = useFormState({
    control,
    name,
    exact: !0
  }), _registerProps = React__default.useRef(control.register(name, {
    ...props.rules,
    value,
    ...isBoolean(props.disabled) ? { disabled: props.disabled } : {}
  })), fieldState = React__default.useMemo(() => Object.defineProperties({}, {
    invalid: {
      enumerable: !0,
      get: /* @__PURE__ */ __name(() => !!get(formState.errors, name), "get")
    },
    isDirty: {
      enumerable: !0,
      get: /* @__PURE__ */ __name(() => !!get(formState.dirtyFields, name), "get")
    },
    isTouched: {
      enumerable: !0,
      get: /* @__PURE__ */ __name(() => !!get(formState.touchedFields, name), "get")
    },
    isValidating: {
      enumerable: !0,
      get: /* @__PURE__ */ __name(() => !!get(formState.validatingFields, name), "get")
    },
    error: {
      enumerable: !0,
      get: /* @__PURE__ */ __name(() => get(formState.errors, name), "get")
    }
  }), [formState, name]), field = React__default.useMemo(() => ({
    name,
    value,
    ...isBoolean(disabled) || formState.disabled ? { disabled: formState.disabled || disabled } : {},
    onChange: /* @__PURE__ */ __name((event) => _registerProps.current.onChange({
      target: {
        value: getEventValue(event),
        name
      },
      type: EVENTS.CHANGE
    }), "onChange"),
    onBlur: /* @__PURE__ */ __name(() => _registerProps.current.onBlur({
      target: {
        value: get(control._formValues, name),
        name
      },
      type: EVENTS.BLUR
    }), "onBlur"),
    ref: /* @__PURE__ */ __name((elm) => {
      const field2 = get(control._fields, name);
      field2 && elm && (field2._f.ref = {
        focus: /* @__PURE__ */ __name(() => elm.focus(), "focus"),
        select: /* @__PURE__ */ __name(() => elm.select(), "select"),
        setCustomValidity: /* @__PURE__ */ __name((message) => elm.setCustomValidity(message), "setCustomValidity"),
        reportValidity: /* @__PURE__ */ __name(() => elm.reportValidity(), "reportValidity")
      });
    }, "ref")
  }), [
    name,
    control._formValues,
    disabled,
    formState.disabled,
    value,
    control._fields
  ]);
  return React__default.useEffect(() => {
    const _shouldUnregisterField = control._options.shouldUnregister || shouldUnregister, updateMounted = /* @__PURE__ */ __name((name2, value2) => {
      const field2 = get(control._fields, name2);
      field2 && field2._f && (field2._f.mount = value2);
    }, "updateMounted");
    if (updateMounted(name, !0), _shouldUnregisterField) {
      const value2 = cloneObject(get(control._options.defaultValues, name));
      set(control._defaultValues, name, value2), isUndefined(get(control._formValues, name)) && set(control._formValues, name, value2);
    }
    return !isArrayField && control.register(name), () => {
      (isArrayField ? _shouldUnregisterField && !control._state.action : _shouldUnregisterField) ? control.unregister(name) : updateMounted(name, !1);
    };
  }, [name, control, isArrayField, shouldUnregister]), React__default.useEffect(() => {
    control._updateDisabledField({
      disabled,
      fields: control._fields,
      name
    });
  }, [disabled, name, control]), React__default.useMemo(() => ({
    field,
    formState,
    fieldState
  }), [field, formState, fieldState]);
}
__name(useController, "useController");
const CheckboxField = /* @__PURE__ */ __name(({
  className,
  children = null,
  control,
  defaultValue,
  fieldName,
  label = "",
  onChange,
  rules,
  shouldUnregister,
  style,
  tooltip,
  isRequiredRight,
  ...rest
}) => {
  var _a;
  const { field, fieldState } = useController({
    control,
    defaultValue,
    name: fieldName,
    rules,
    shouldUnregister
  }), handleChange = /* @__PURE__ */ __name((e) => {
    const value = e.target.checked;
    field.onChange(value), onChange == null || onChange(value);
  }, "handleChange");
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    FormItem,
    {
      className,
      help: (_a = fieldState.error) == null ? void 0 : _a.message,
      label,
      required: !!(rules != null && rules.required),
      style: { ...style, userSelect: "none" },
      tooltip,
      isRequiredRight,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { ...rest, isChecked: field.value, onChange: handleChange, value: field.value, children })
    }
  );
}, "CheckboxField"), DatePickerField = /* @__PURE__ */ __name(({
  className,
  control,
  defaultValue,
  fieldName,
  isHorizontal,
  label = "",
  onChange,
  rules,
  shouldUnregister,
  tooltip,
  isRequiredRight,
  ...rest
}) => {
  var _a;
  const { field, fieldState } = useController({
    control,
    defaultValue,
    name: fieldName,
    rules,
    shouldUnregister
  }), handleChange = /* @__PURE__ */ __name((date, dateString) => {
    field.onChange(date), onChange == null || onChange(dateString, date);
  }, "handleChange");
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    FormItem,
    {
      className,
      help: (_a = fieldState.error) == null ? void 0 : _a.message,
      label,
      layout: isHorizontal ? "horizontal" : "vertical",
      required: !!(rules != null && rules.required),
      tooltip,
      isRequiredRight,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { ...rest, ...field, onChange: handleChange, status: fieldState.invalid ? "error" : void 0 })
    }
  );
}, "DatePickerField"), InputField = /* @__PURE__ */ __name(({
  className,
  control,
  defaultValue,
  fieldName,
  isHorizontal,
  isNumberInputClearable = !0,
  label = "",
  onChange,
  rules,
  shouldUnregister,
  type = "text",
  style,
  tooltip,
  isRequiredRight,
  ...rest
}) => {
  var _a;
  const { field, fieldState } = useController({
    control,
    defaultValue,
    name: fieldName,
    rules,
    shouldUnregister
  }), handleChange = /* @__PURE__ */ __name((e) => {
    let value = e.target.value;
    isNumberInputClearable || value === "" && (value = "0"), field.onChange(value), onChange == null || onChange(value);
  }, "handleChange");
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    FormItem,
    {
      className,
      help: (_a = fieldState.error) == null ? void 0 : _a.message,
      label,
      layout: isHorizontal ? "horizontal" : "vertical",
      required: !!(rules != null && rules.required),
      style,
      tooltip,
      isRequiredRight,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          ...rest,
          ...field,
          onChange: handleChange,
          status: fieldState.invalid ? "error" : "",
          type,
          value: field.value ?? ""
        }
      )
    }
  );
}, "InputField"), MaskedInputField = /* @__PURE__ */ __name(({
  className,
  control,
  defaultValue,
  fieldName,
  isHorizontal,
  label = "",
  onChange,
  rules,
  shouldUnregister,
  type = "text",
  style,
  tooltip,
  isRequiredRight,
  ...rest
}) => {
  var _a;
  const { field, fieldState } = useController({
    control,
    defaultValue,
    name: fieldName,
    rules,
    shouldUnregister
  }), handleChange = /* @__PURE__ */ __name((_e, maskedValue) => {
    field.onChange(maskedValue), onChange == null || onChange(maskedValue);
  }, "handleChange");
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    FormItem,
    {
      className,
      help: (_a = fieldState.error) == null ? void 0 : _a.message,
      label,
      layout: isHorizontal ? "horizontal" : "vertical",
      required: !!(rules != null && rules.required),
      style,
      tooltip,
      isRequiredRight,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        MaskedInput,
        {
          ...rest,
          ...field,
          onChange: handleChange,
          status: fieldState.invalid ? "error" : "",
          type,
          value: field.value ?? ""
        }
      )
    }
  );
}, "MaskedInputField"), MultipleSelectField = /* @__PURE__ */ __name(({
  className,
  control,
  defaultValue,
  fieldName,
  isHorizontal,
  label = "",
  onChange,
  rules,
  shouldUnregister,
  tooltip,
  isRequiredRight,
  ...rest
}) => {
  var _a;
  const { field, fieldState } = useController({
    control,
    defaultValue,
    name: fieldName,
    rules,
    shouldUnregister
  }), handleChange = /* @__PURE__ */ __name((value, options) => {
    field.onChange(value), onChange == null || onChange(value, options);
  }, "handleChange");
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    FormItem,
    {
      className,
      help: (_a = fieldState.error) == null ? void 0 : _a.message,
      label,
      layout: isHorizontal ? "horizontal" : "vertical",
      required: !!(rules != null && rules.required),
      tooltip,
      isRequiredRight,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        MultipleSelect,
        {
          ...rest,
          ...field,
          onChange: handleChange,
          status: fieldState.invalid ? "error" : void 0,
          style: { width: "100%" }
        }
      )
    }
  );
}, "MultipleSelectField");
function RangePickerField({
  className,
  control,
  defaultValue,
  fieldName,
  isHorizontal,
  label = "",
  onChange,
  rules,
  shouldUnregister,
  tooltip,
  isRequiredRight,
  ...rest
}) {
  var _a;
  const { field, fieldState } = useController({
    control,
    defaultValue,
    name: fieldName,
    rules,
    shouldUnregister
  }), handleChange = /* @__PURE__ */ __name((_date, dateString) => {
    field.onChange(dateString), onChange == null || onChange(dateString);
  }, "handleChange");
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    FormItem,
    {
      className,
      help: (_a = fieldState.error) == null ? void 0 : _a.message,
      label,
      layout: isHorizontal ? "horizontal" : "vertical",
      required: !!(rules != null && rules.required),
      tooltip,
      isRequiredRight,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        RangePicker,
        {
          ...rest,
          ...field,
          onChange: handleChange,
          status: fieldState.invalid ? "error" : void 0,
          value: void 0
        }
      )
    }
  );
}
__name(RangePickerField, "RangePickerField");
const SelectField = /* @__PURE__ */ __name(({
  className,
  control,
  defaultValue,
  fieldName,
  isHorizontal,
  label = "",
  onChange,
  rules,
  shouldUnregister,
  tooltip,
  isRequiredRight,
  ...rest
}) => {
  var _a;
  const { field, fieldState } = useController({
    control,
    defaultValue,
    name: fieldName,
    rules,
    shouldUnregister
  }), handleChange = /* @__PURE__ */ __name((value, option) => {
    field.onChange(value), onChange == null || onChange(value, option);
  }, "handleChange");
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    FormItem,
    {
      className,
      help: (_a = fieldState.error) == null ? void 0 : _a.message,
      label,
      layout: isHorizontal ? "horizontal" : "vertical",
      required: !!(rules != null && rules.required),
      tooltip,
      isRequiredRight,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Select,
        {
          ...rest,
          ...field,
          onChange: handleChange,
          status: fieldState.invalid ? "error" : void 0,
          style: { width: "100%" }
        }
      )
    }
  );
}, "SelectField"), TextAreaField = /* @__PURE__ */ __name(({
  className,
  control,
  defaultValue,
  fieldName,
  isHorizontal,
  label = "",
  onChange,
  rows = 4,
  rules,
  shouldUnregister,
  style,
  tooltip,
  isRequiredRight,
  ...rest
}) => {
  var _a;
  const { field, fieldState } = useController({
    control,
    defaultValue,
    name: fieldName,
    rules,
    shouldUnregister
  }), handleChange = /* @__PURE__ */ __name((e) => {
    const value = e.target.value;
    field.onChange(value), onChange == null || onChange(value);
  }, "handleChange");
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    FormItem,
    {
      className,
      help: (_a = fieldState.error) == null ? void 0 : _a.message,
      label,
      layout: isHorizontal ? "horizontal" : "vertical",
      required: !!(rules != null && rules.required),
      style,
      tooltip,
      isRequiredRight,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        TextArea,
        {
          ...rest,
          ...field,
          onChange: handleChange,
          rows,
          status: fieldState.invalid ? "error" : "",
          value: field.value ?? ""
        }
      )
    }
  );
}, "TextAreaField"), TimePickerField = /* @__PURE__ */ __name(({
  className,
  control,
  defaultValue,
  fieldName,
  isHorizontal,
  label = "",
  onChange,
  rules,
  shouldUnregister,
  tooltip,
  isRequiredRight,
  ...rest
}) => {
  var _a;
  const { field, fieldState } = useController({
    control,
    defaultValue,
    name: fieldName,
    rules,
    shouldUnregister
  }), handleChange = /* @__PURE__ */ __name((_date, dateString) => {
    field.onChange(dateString), onChange == null || onChange(dateString);
  }, "handleChange");
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    FormItem,
    {
      className,
      help: (_a = fieldState.error) == null ? void 0 : _a.message,
      label,
      layout: isHorizontal ? "horizontal" : "vertical",
      required: !!(rules != null && rules.required),
      tooltip,
      isRequiredRight,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        TimePicker,
        {
          ...rest,
          ...field,
          onChange: handleChange,
          status: fieldState.invalid ? "error" : void 0,
          value: void 0
        }
      )
    }
  );
}, "TimePickerField");
export {
  CheckboxField,
  CheckboxField as ControllerCheckbox,
  TextAreaField as ControllerTextArea,
  DatePickerField,
  InputField,
  MaskedInputField,
  MultipleSelectField,
  RangePickerField,
  SelectField,
  TextAreaField,
  TimePickerField
};
