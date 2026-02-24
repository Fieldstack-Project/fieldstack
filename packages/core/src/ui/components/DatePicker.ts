export interface DatePickerProps {
  value: Date | null;
  minDate?: Date;
  maxDate?: Date;
  onChange: (value: Date | null) => void;
}
