import type { Metadata } from "next";
import ChaptersPage from "./ChaptersPage";

export const metadata: Metadata = {
  title: "Master Data — Chapter",
};

export default function Page() {
  return <ChaptersPage />;
}
