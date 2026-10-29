import * as React from "react";

export function IconField({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-tp-muted [&>svg]:h-5 [&>svg]:w-5"
      >
        {icon}
      </span>
      {children}
    </div>
  );
}
