import { type FocusEvent, type MouseEvent } from "react";

interface DateInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  /** Returns an error message when the date is not acceptable. */
  validate?: (value: string) => string | undefined;
}

export default function DateInput({
  id,
  value,
  onChange,
  min,
  max,
  required,
  disabled,
  className,
  validate,
}: DateInputProps) {
  const openPicker = (event: MouseEvent<HTMLInputElement>) => {
    try {
      // Opens the calendar when the text part of the field is clicked.
      event.currentTarget.showPicker?.();
    } catch {
      // Browsers without the API open the calendar on their own.
    }
  };

  const applyValue = (input: HTMLInputElement, next: string) => {
    if (!next) {
      input.setCustomValidity("");
      onChange("");
      return;
    }

    const error = validate?.(next);

    if (error) {
      input.setCustomValidity(error);
      input.reportValidity();
      onChange("");
      return;
    }

    input.setCustomValidity("");
    onChange(next);
  };

  return (
    <input
      id={id}
      type="date"
      required={required}
      disabled={disabled}
      min={min}
      max={max}
      value={value ?? ""}
      onClick={openPicker}
      onChange={(event) => applyValue(event.currentTarget, event.target.value)}
      onBlur={(event: FocusEvent<HTMLInputElement>) =>
        applyValue(event.currentTarget, event.target.value)
      }
      className={className}
    />
  );
}
