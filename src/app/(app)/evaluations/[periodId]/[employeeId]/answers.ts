export function answerToString(value: {
  valueNumeric?: number | null;
  valueBool?: boolean | null;
  valueText?: string | null;
}): string {
  if (value.valueBool !== null && value.valueBool !== undefined) {
    return value.valueBool ? "yes" : "no";
  }
  if (value.valueNumeric !== null && value.valueNumeric !== undefined) {
    return String(value.valueNumeric);
  }
  return value.valueText ?? "";
}

export function parseNumeric(raw?: string): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isNaN(n) ? undefined : n;
}

export function parseBool(raw?: string): boolean | undefined {
  if (raw === "yes") return true;
  if (raw === "no") return false;
  return undefined;
}

export function valueText(raw?: string): string | undefined {
  if (!raw) return undefined;
  if (raw === "yes" || raw === "no") return undefined;
  const n = Number(raw);
  if (!Number.isNaN(n)) return undefined;
  return raw;
}
