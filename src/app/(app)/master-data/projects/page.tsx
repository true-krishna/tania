import type { Metadata } from "next";
import ProjectsPage from "./ProjectsPage";

export const metadata: Metadata = {
  title: "Master Data — Initiative",
};

export default function Page() {
  return <ProjectsPage />;
}
