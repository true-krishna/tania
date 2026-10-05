import * as React from "react";

/**
 * Inline stroke icons used by the app shell. Kept dependency-free on purpose:
 * the project ships no icon library, and the set is small and stable.
 */
export type IconName =
  | "dashboard"
  | "employees"
  | "assignments"
  | "idp"
  | "cv"
  | "evaluations"
  | "accounts"
  | "masterData"
  | "audit"
  | "chevronDown"
  | "signOut"
  | "resize";

const PATHS: Record<IconName, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
    </>
  ),
  employees: (
    <>
      <path d="M15.5 20v-1.5a3.5 3.5 0 0 0-3.5-3.5H6a3.5 3.5 0 0 0-3.5 3.5V20" />
      <circle cx="9" cy="8" r="3.2" />
      <path d="M17 11.2a3 3 0 0 0 0-5.9M21.5 20v-1.4a3.6 3.6 0 0 0-2.6-3.3" />
    </>
  ),
  assignments: (
    <>
      <path d="M9 4.5H7.2A1.7 1.7 0 0 0 5.5 6.2v12.6a1.7 1.7 0 0 0 1.7 1.7h9.6a1.7 1.7 0 0 0 1.7-1.7V6.2a1.7 1.7 0 0 0-1.7-1.7H15" />
      <path d="M9.5 3h5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5v-1A.5.5 0 0 1 9.5 3Z" />
      <path d="M9 12h6M9 15.5h4" />
    </>
  ),
  idp: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22" />
    </>
  ),
  cv: (
    <>
      <path d="M14 3H7.5A1.5 1.5 0 0 0 6 4.5v15A1.5 1.5 0 0 0 7.5 21h9a1.5 1.5 0 0 0 1.5-1.5V7z" />
      <path d="M14 3v4h4M9.5 12.5h5M9.5 16h3.5" />
    </>
  ),
  evaluations: (
    <>
      <path d="M9 4.5H7.2A1.7 1.7 0 0 0 5.5 6.2v12.6a1.7 1.7 0 0 0 1.7 1.7h9.6a1.7 1.7 0 0 0 1.7-1.7V6.2a1.7 1.7 0 0 0-1.7-1.7H15" />
      <path d="M9.5 3h5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5v-1A.5.5 0 0 1 9.5 3Z" />
      <path d="M9 14.5l2 2 4-4.5" />
    </>
  ),
  accounts: (
    <>
      <path d="M12 3l7 2.6v5.9c0 3.9-2.9 7.2-7 8.4-4.1-1.2-7-4.5-7-8.4V5.6z" />
      <circle cx="12" cy="10.5" r="2" />
      <path d="M8.7 16a3.5 3.5 0 0 1 6.6 0" />
    </>
  ),
  masterData: (
    <>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
      <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
    </>
  ),
  audit: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.2l2.8 1.8" />
    </>
  ),
  chevronDown: <path d="M6 9.5l6 6 6-6" />,
  signOut: (
    <>
      <path d="M9.5 21H5.5A1.5 1.5 0 0 1 4 19.5v-15A1.5 1.5 0 0 1 5.5 3h4" />
      <path d="M16 16.5l4.5-4.5L16 7.5M20 12H9" />
    </>
  ),
  resize: (
    <>
      <circle cx="10" cy="8" r="1.1" />
      <circle cx="14" cy="8" r="1.1" />
      <circle cx="10" cy="12" r="1.1" />
      <circle cx="14" cy="12" r="1.1" />
      <circle cx="10" cy="16" r="1.1" />
      <circle cx="14" cy="16" r="1.1" />
    </>
  ),
};

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
}

export function Icon({ name, className = "h-5 w-5", ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}