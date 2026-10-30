import type { Metadata } from "next";
import { CvSelfPage } from "@/features/cv/CvSelfPage";

export const metadata: Metadata = {
  title: "CV saya",
};

export default function Page() {
  return <CvSelfPage />;
}
