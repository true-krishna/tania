import type { Metadata } from "next";
import JobRolesPage from "./JobRolesPage";

export const metadata: Metadata = {
  title: "Master Data — Job Role",
};

export default function Page() {
  return <JobRolesPage />;
}
