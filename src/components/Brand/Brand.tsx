import { cn } from "@/lib/cn";

type BrandVariant = "small" | "large";

interface BrandProps {
  variant?: BrandVariant;
  light?: boolean;
  className?: string;
}

export function Brand({ variant = "large", light = false, className }: BrandProps) {
  if (variant === "small") {
    return (
      <svg
        aria-label="TANIA"
        className={cn("size-[1em] shrink-0 text-[32px]", className)}
        role="img"
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect fill="#e1231a" height="48" rx="12" width="48" />
        <path d="M13 14h22v6.5h-7.6V35h-6.8V20.5H13z" fill="#fff" />
      </svg>
    );
  }

  return (
    <svg
      aria-label="TANIA"
      className={cn("h-[1em] w-auto shrink-0 text-[40px]", className)}
      role="img"
      viewBox="0 0 141 49"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.62 27.93h7.13v19.01h7.3V27.93h7.13V22H2.62Zm21.72 19.01h8.11l.96-5.01h7.95l.95 5.01h8.12L42 22h-9.24Zm10.36-9.93h5.36l-2.68-10.16Zm17.86 9.93h6.82V31.88l10.85 15.06h6.52V22h-6.94v14.01L59.53 22h-6.97Zm28.5 0h7.5V22h-7.5Zm9.27 0h8.12l.96-5.01h7.94l.96 5.01h8.11L108 22h-9.24Zm10.37-9.93h5.36l-2.68-10.16Z"
        fill={light ? "#fff" : "#0b1f4d"}
        fillRule="evenodd"
      />
      <path
        d="M129.18 22.06c-.32-.05-.72-.24-.88-.41-.33-.37-.99-2.73-1.23-4.39-.25-1.73-.61-2.07-2.35-2.26-1.31-.15-3.79-.84-4.31-1.21-.67-.47-.59-2.24.12-2.65.63-.36 2.88-.97 4.22-1.14 1.96-.26 2.04-.34 2.31-2.21.16-1.15.9-4.12 1.08-4.4.49-.71 2.23-.69 2.71.03.18.27.92 3.29 1.09 4.44.26 1.78.36 1.88 2.31 2.14 1.82.24 4.04.91 4.45 1.35.45.5.44 1.87-.03 2.32-.45.44-2.81 1.15-4.39 1.33-1.78.2-2.12.54-2.37 2.38-.19 1.33-.83 3.68-1.13 4.13-.27.41-.96.65-1.6.55"
        fill="#e1231a"
        fillRule="evenodd"
      />
    </svg>
  );
}
