"use client";

import { ActivitiesPageView, ActivitiesProvider } from "@/features/activities";

export default function ActivitiesPage() {
  return (
    <ActivitiesProvider>
      <ActivitiesPageView />
    </ActivitiesProvider>
  );
}
