/** Teks sel tabel: "no value" (null/undefined/kosong/whitespace) tampil "-". */
export function orDash(value: unknown): string {
  if (value == null) return "-";
  const text = String(value);
  return text.trim() === "" ? "-" : text;
}
