"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

type BaseProps = {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  wrapperClassName?: string;
};

function Wrapper({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: BaseProps & { id: string; children: React.ReactNode }) {
  return (
    <div className={cn("min-w-0", className)}>
      {label ? (
        <label htmlFor={id} className="field-label">
          {label}
          {required ? <span className="text-coral"> *</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="field-hint">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  BaseProps & React.InputHTMLAttributes<HTMLInputElement>
>(function Input(
  { label, hint, error, required, className, wrapperClassName, ...props },
  ref,
) {
  const generated = useId();
  const id = props.id ?? generated;
  return (
    <Wrapper
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={wrapperClassName}
    >
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn("field", className)}
        {...props}
      />
    </Wrapper>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea(
  { label, hint, error, required, className, wrapperClassName, ...props },
  ref,
) {
  const generated = useId();
  const id = props.id ?? generated;
  return (
    <Wrapper
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={wrapperClassName}
    >
      <textarea
        ref={ref}
        id={id}
        rows={props.rows ?? 4}
        aria-invalid={error ? true : undefined}
        className={cn("field resize-y", className)}
        {...props}
      />
    </Wrapper>
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  BaseProps & React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select(
  {
    label,
    hint,
    error,
    required,
    className,
    wrapperClassName,
    children,
    ...props
  },
  ref,
) {
  const generated = useId();
  const id = props.id ?? generated;
  return (
    <Wrapper
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={wrapperClassName}
    >
      <select
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn("field", className)}
        {...props}
      >
        {children}
      </select>
    </Wrapper>
  );
});

export function Checkbox({
  label,
  error,
  className,
  ...props
}: {
  label: React.ReactNode;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const generated = useId();
  const id = props.id ?? generated;
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          className="accent-coral mt-1 size-[18px] flex-none"
          {...props}
        />
        <label htmlFor={id} className="text-cocoa text-sm leading-relaxed">
          {label}
        </label>
      </div>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Radio-style pill group shared by the builder, product page and checkout. */
export function ChoiceGroup<T extends string>({
  label,
  hint,
  error,
  required,
  options,
  value,
  onChange,
  columns,
  className,
}: BaseProps & {
  options: {
    value: T;
    label: string;
    sublabel?: string;
    disabled?: boolean;
  }[];
  value?: T;
  onChange: (value: T) => void;
  columns?: boolean;
}) {
  return (
    <fieldset className={cn("min-w-0 border-0 p-0", className)}>
      {label ? (
        <legend className="field-label">
          {label}
          {required ? <span className="text-coral"> *</span> : null}
        </legend>
      ) : null}
      <div
        className={cn(
          columns
            ? "grid grid-cols-2 gap-2.5 sm:grid-cols-3"
            : "flex flex-wrap gap-2.5",
        )}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={option.disabled}
            data-selected={value === option.value}
            data-disabled={option.disabled || undefined}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn("choice-pill", !columns && "min-w-[118px]")}
          >
            <span className="flex flex-col items-center leading-tight">
              <span>{option.label}</span>
              {option.sublabel ? (
                <span className="text-[11px] font-medium opacity-70">
                  {option.sublabel}
                </span>
              ) : null}
            </span>
          </button>
        ))}
      </div>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="field-hint">{hint}</p>
      ) : null}
    </fieldset>
  );
}
