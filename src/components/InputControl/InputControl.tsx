import * as React from "react";
import { cn } from "@/lib/cn";

type InputControlProps = {
  children: React.ReactNode;
  className?: string;
  error?: string | null;
  helper?: React.ReactNode;
  htmlFor?: string;
  label: React.ReactNode;
  required?: boolean;
};

export function InputControl(props: InputControlProps) {
  const { children, className, error, helper, htmlFor, label, required } = props;

  return (
    <label
      className={cn("flex flex-col gap-1 text-sm font-medium text-zinc-700", className)}
      htmlFor={htmlFor}
    >
      <span>
        {label}
        {required ? <span className="text-tp-ink-peach"> *</span> : null}
      </span>
      {children}
      {helper && !error ? (
        <span className="text-xs font-normal text-zinc-500">{helper}</span>
      ) : null}
      {error ? (
        <span className="text-xs font-normal text-red-600" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
