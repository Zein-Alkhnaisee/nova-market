import type { SelectHTMLAttributes } from "react";

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
}

/** Labelled native select, styled like TextField (native = free keyboard + screen-reader support). */
export function SelectField({ id, label, error, hint, className, children, ...props }: SelectFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`h-11 rounded-[var(--radius-sm)] border bg-background px-3 text-sm text-foreground ${
          error ? "border-danger" : "border-border"
        } ${className ?? ""}`}
        {...props}
      >
        {children}
      </select>
      {hint ? <p id={hintId} className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p id={errorId} className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
