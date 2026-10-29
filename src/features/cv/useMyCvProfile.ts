"use client";

import { useQuery } from "@apollo/client";
import { MyCvProfileDocument, type CvFieldsFragment } from "@/generated/graphql";
import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";

/**
 * Talent's own CV profile (FR-12/FR-13).
 * `myCvProfile` is null until the talent saves their first CV section; that is
 * an empty state, not an error.
 * K5/O2 — bucket Pengalaman Kerja selalu terkini: `cache-and-network` agar
 * riwayat assignment yang baru diakhiri/diubah (di permukaan lain sesi yang
 * sama) ikut diperbarui dari server, bukan hanya dari cache.
 */
export function useMyCvProfile(): QueryState<CvFieldsFragment | undefined> {
  const result = useQuery(MyCvProfileDocument, { fetchPolicy: "cache-and-network" });
  return toQueryState({
    ...result,
    data: result.data?.myCvProfile as CvFieldsFragment | undefined,
  });
}
