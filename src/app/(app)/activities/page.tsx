import type { Metadata } from "next";
import ActivitiesPage from "./ActivitiesPage";

export const metadata: Metadata = {
  title: "Aktivitas saya",
};

export default function Page() {
  return <ActivitiesPage />;
}
