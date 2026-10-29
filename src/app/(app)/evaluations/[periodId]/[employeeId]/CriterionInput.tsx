import { Input } from "@/components/Input";
import type { EvaluationAnswerType } from "@/generated/graphql/types";

const INPUT =
  "rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-tp-brand-red focus:outline-none focus:ring-1 focus:ring-tp-brand-red disabled:bg-zinc-50 disabled:text-zinc-400";

export function CriterionInput({
  answerType,
  value,
  disabled,
  onChange,
}: {
  answerType: EvaluationAnswerType;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  if (answerType === "YES_NO") {
    return (
      <select
        className={INPUT}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        value={value}
      >
        <option value="">— pilih —</option>
        <option value="yes">Ya</option>
        <option value="no">Tidak</option>
      </select>
    );
  }
  if (answerType === "SCALE_1_5" || answerType === "SCALE_1_10") {
    const max = answerType === "SCALE_1_5" ? 5 : 10;
    return (
      <select
        className={INPUT}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        value={value}
      >
        <option value="">— pilih —</option>
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <option key={n} value={String(n)}>
            {n}
          </option>
        ))}
      </select>
    );
  }
  return (
    <Input
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Jawaban teks bebas"
      value={value}
    />
  );
}
