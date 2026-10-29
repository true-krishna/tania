export function WorkloadSkeletonBlock({
  className = "",
  dark = false,
}: {
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-[10px] ${dark ? "bg-white/18" : "border border-tp-line bg-tp-bg"} ${className}`}
    />
  );
}
