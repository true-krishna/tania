"use client";

import type { MenuConfigStatus } from "@/lib/auth/menuAccess";

export function SidebarNotice({
  status,
  notice,
  onRetry,
}: {
  status: MenuConfigStatus;
  notice: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-1 px-2 py-1">
      <p className="text-sm text-tp-muted" role={status === "error" ? "alert" : undefined}>
        {notice}
      </p>
      {status === "error" && onRetry ? (
        <button
          className="text-sm font-medium text-tp-text underline-offset-2 hover:underline"
          onClick={onRetry}
          type="button"
        >
          Coba lagi
        </button>
      ) : null}
    </div>
  );
}
