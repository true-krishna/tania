import { cn } from "@/lib/cn";

export function ProfileField({
  label,
  reason,
  value,
}: {
  label: string;
  reason?: string;
  value?: string | null;
}) {
  const filled = typeof value === "string" && value.trim() !== "";

  return (
    <div className="min-w-0">
      <dt className="text-[13px] leading-5 text-tp-muted">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 break-words text-[15px] leading-6",
          filled ? "font-semibold text-tp-text" : "text-tp-muted",
        )}
      >
        {filled ? (
          value
        ) : (
          <span>—{reason ? <span className="font-normal"> · {reason}</span> : null}</span>
        )}
      </dd>
    </div>
  );
}
