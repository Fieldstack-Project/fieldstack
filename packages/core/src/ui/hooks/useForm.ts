export type FormErrors = Record<string, string | undefined>;

export interface UseFormOptions<TValues> {
  initialValues: TValues;
  validate?: (values: TValues) => FormErrors;
}

export interface UseFormState<TValues> {
  values: TValues;
  errors: FormErrors;
  setFieldValue: <TKey extends keyof TValues>(key: TKey, value: TValues[TKey]) => void;
  reset: () => void;
  submit: () => Promise<boolean>;
}
