const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function formatProfileDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return value;
  return `${Number(match[3])} ${month} ${match[1]}`;
}
