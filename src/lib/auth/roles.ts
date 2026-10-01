import type { AccessRole } from "@/generated/graphql";

/**
 * Peran akses aplikasi (map 1:1 dengan enum `AccessRole` pada kontrak
 * `contracts/schema.graphql`). Otorisasi DITEGAKKAN di server (FR-16);
 * lapisan ini hanya menyembunyikan menu/aksi agar tidak ditampilkan ke peran
 * yang tidak berhak — bukan pengaman.
 *
 * Urutan dipakai untuk keputusan "adakah hak yang lebih tinggi":
 * TALENT < CHAPTER < OPERATION < ADMIN.
 */
export const ROLE_ORDER: Record<AccessRole, number> = {
  TALENT: 0,
  CHAPTER: 1,
  OPERATION: 2,
  ADMIN: 3,
};

export type RoleOrMore = keyof typeof ROLE_ORDER;

/**
 * true bila `current` memiliki peran `required` atau lebih tinggi.
 * Guard rute per peran dipakai konsisten di seluruh layout `(app)/*` dan
 * menu (plan.md §10.2: "Guard peran: test render rute dengan peran berbeda
 * memastikan menu/aksi tersembunyi").
 */
export function atLeast(current: AccessRole | null | undefined, required: RoleOrMore): boolean {
  if (!current) return false;
  return ROLE_ORDER[current] >= ROLE_ORDER[required];
}