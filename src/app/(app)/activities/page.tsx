"use client";

import { ActivitiesPageView, ActivitiesProvider } from "@/features/activities";

/**
 * `/activities` — the Talent-facing activity-capture surface (US1).
 *
 * The fixture store is mounted here; GraphQL wiring (TAN-108/T005) replaces it
 * behind the same provider. The route carries no `tmsId` or other personal data
 * in its URL or query string (SC-006).
 */
export default function ActivitiesPage() {
  return (
    <ActivitiesProvider>
      <ActivitiesPageView />
    </ActivitiesProvider>
  );
}
