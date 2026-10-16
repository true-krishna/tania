"use client";

import * as React from "react";
import { getTalentWorkloadFixture } from "./mocks";
import type { TalentWorkloadFixture } from "./types";

export type TalentWorkloadState =
  | { status: "loading" }
  | { status: "ready"; fixture: TalentWorkloadFixture | null }
  | { status: "error" };

/**
 * Loads the per-talent fixture for a period + selected talent. `talentId`
 * `null` (belum memilih) tetap `ready` dengan fixture `null` — tampil sebagai
 * state informasional, bukan error. Kontrak `status` sama dengan versi GraphQL
 * nanti; id talent tidak pernah dikirim ke URL.
 */
export function useTalentWorkload(
  period: string,
  talentId: string | null,
  reloadKey = 0,
): TalentWorkloadState {
  const [state, setState] = React.useState<TalentWorkloadState>({ status: "loading" });

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: entering the loading state is the point of a refetch
    setState({ status: "loading" });
    const timer = setTimeout(() => {
      if (!talentId) {
        setState({ status: "ready", fixture: null });
        return;
      }
      const fixture = getTalentWorkloadFixture(period, talentId);
      setState({ status: "ready", fixture });
    }, 350);

    return () => clearTimeout(timer);
  }, [period, talentId, reloadKey]);

  return state;
}
