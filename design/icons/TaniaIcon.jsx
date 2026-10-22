import React from "react";

const paths = {
  "beranda": (<><path d="M4 11l8-7 8 7M6 10v9h12v-9"/><path d="M10 19v-5h4v5" stroke="var(--tania-primary, #172B4D)"/></>),
  "dashboard": (<><rect height="9" rx="2" width="7" x="4" y="4"/><rect height="5" rx="2" width="7" x="13" y="4"/><rect height="5" rx="2" width="7" x="4" y="15"/><rect height="8" rx="2" stroke="var(--tania-mint, #0F6E48)" width="7" x="13" y="12"/></>),
  "profil": (<><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" stroke="var(--tania-primary, #172B4D)"/></>),
  "chapter": (<><circle cx="12" cy="7" r="2.5"/><circle cx="6" cy="17" r="2.5"/><circle cx="18" cy="17" r="2.5"/><path d="M10.5 9l-3 6M13.5 9l3 6"/><path d="M8.5 17h7" stroke="var(--tania-primary, #172B4D)"/></>),
  "timesheet": (<><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2" stroke="var(--tania-primary, #172B4D)"/></>),
  "workload": (<><path d="M5 20v-8M19 20V9"/><path d="M12 20V5" stroke="var(--tania-mint, #0F6E48)"/></>),
  "feasibility": (<><path d="M9 18h6M10 21h4M8.5 14.5a6 6 0 1 1 7 0c-.8.7-1.5 1.5-1.5 2.5h-4c0-1-.7-1.8-1.5-2.5z"/><path d="M10.5 11.5L12 13l1.5-1.5" stroke="var(--tania-mint, #0F6E48)"/></>),
  "budget": (<><rect height="14" rx="3" width="18" x="3" y="6"/><path d="M3 10h18"/><path d="M16 15h.01" stroke="var(--tania-primary, #172B4D)" strokeWidth="3"/></>),
  "assignment": (<><rect height="17" rx="2.5" width="14" x="5" y="4"/><path d="M9 4V3h6v1"/><path d="M9 13l2 2 4-4" stroke="var(--tania-mint, #0F6E48)"/></>),
  "idp": (<><path d="M5 20h14M12 20v-9"/><path d="M12 14c-3.5 0-5.5-1.8-5.5-5 3.5 0 5.5 1.8 5.5 5z"/><path d="M12 11c0-4 2.5-6.5 7-6.5 0 4-2.5 6.5-7 6.5z" stroke="var(--tania-mint, #0F6E48)"/></>),
  "evaluasi": (<><path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4-5" stroke="var(--tania-primary, #172B4D)"/><path d="M12 16h.01" strokeWidth="3"/></>),
  "profil-cv": (<><path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6"/><path d="M9 16h4" stroke="var(--tania-mint, #0F6E48)"/></>),
  "master-data": (<><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" stroke="var(--tania-mint, #0F6E48)"/></>),
  "jejak-audit": (<><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4" stroke="var(--tania-primary, #172B4D)"/></>),
  "ask-tania": (<><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17v4M17 19h4" stroke="var(--tania-mint, #0F6E48)"/></>),
  "sinyal": (<><path d="M4 9a11 11 0 0 1 16 0M7 12.5a7 7 0 0 1 10 0M10 16a3 3 0 0 1 4 0"/><circle cx="12" cy="19.5" r="1" stroke="var(--tania-primary, #172B4D)" strokeWidth="3"/></>),
  "notifikasi": (<><path d="M6 17V11a6 6 0 1 1 12 0v6l1.5 2h-15z"/><path d="M10 21h4" stroke="var(--tania-mint, #0F6E48)"/></>),
};

export const ICON_NAMES = ["beranda", "dashboard", "profil", "chapter", "timesheet", "workload", "feasibility", "budget", "assignment", "idp", "evaluasi", "profil-cv", "master-data", "jejak-audit", "ask-tania", "sinyal", "notifikasi"];

export default function TaniaIcon({ name, size = 24, title, className, style, ...rest }) {
  const glyph = paths[name];
  if (!glyph) return null;
  return (
    <svg
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={className}
      fill="none"
      height={size}
      role={title ? "img" : undefined}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      style={style}
      viewBox="0 0 24 24"
      width={size}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {glyph}
    </svg>
  );
}
