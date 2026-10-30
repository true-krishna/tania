import type { ChipVariant } from "@/components/Chip";

const SOON_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface CertificationExpiry {
  label: string;
  variant: ChipVariant;
}

function startOfDay(time: number): number {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Expiry tone of one certification, computed from `expiryDate` (a `Date`
 * scalar, ISO `yyyy-mm-dd`). `null` when the certification carries no expiry —
 * "tanpa masa berlaku", never a fabricated date.
 */
export function certificationExpiry(
  expiryDate: string | null | undefined,
  now: number = Date.now(),
): CertificationExpiry | null {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate).getTime();
  if (Number.isNaN(expiry)) return null;

  const days = Math.round((startOfDay(expiry) - startOfDay(now)) / DAY_MS);
  if (days < 0) return { label: "Kedaluwarsa", variant: "danger" };
  if (days <= SOON_DAYS) return { label: "Segera berakhir", variant: "warning" };
  return { label: "Berlaku", variant: "success" };
}
