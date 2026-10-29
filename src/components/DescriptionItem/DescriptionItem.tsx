type DescriptionItemVariant = "default" | "compact" | "preline";

type DescriptionItemProps = {
  label: string;
  value: string;
  mono?: boolean;
  variant?: DescriptionItemVariant;
};

export function DescriptionItem({
  label,
  value,
  mono = false,
  variant = "default",
}: DescriptionItemProps) {
  if (variant === "compact") {
    return (
      <div>
        <dt className="text-xs font-medium text-zinc-500">{label}</dt>
        <dd className="mt-0.5 text-sm text-zinc-800">{value || "—"}</dd>
      </div>
    );
  }

  if (variant === "preline") {
    return (
      <div>
        <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
        <dd className="mt-0.5 whitespace-pre-wrap text-sm text-zinc-900">{value}</dd>
      </div>
    );
  }

  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className={mono ? "font-mono text-zinc-900" : "text-zinc-900"}>{value}</dd>
    </div>
  );
}
