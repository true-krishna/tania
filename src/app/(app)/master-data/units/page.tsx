import type { Metadata } from "next";
import UnitsPage from "./UnitsPage";

export const metadata: Metadata = {
  title: "Master Data — Unit",
};

export default function Page() {
  return <UnitsPage />;
}
