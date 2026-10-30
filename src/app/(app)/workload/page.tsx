import type { Metadata } from "next";
import { TalentWorkloadPage } from "@/features/workload/TalentWorkloadPage";

export const metadata: Metadata = {
  title: "Workload saya",
};

export default function Page() {
  return <TalentWorkloadPage />;
}
