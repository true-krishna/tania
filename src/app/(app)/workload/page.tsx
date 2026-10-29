import type { Metadata } from "next";
import WorkloadPage from "./WorkloadPage";

export const metadata: Metadata = {
  title: "Workload",
};

export default function Page() {
  return <WorkloadPage />;
}
