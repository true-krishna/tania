import type { Metadata } from "next";
import CvPage from "@/features/cv/CvPage";

export const metadata: Metadata = {
  description:
    "Profil CV talent Tania: ringkasan, pendidikan, sertifikasi, keahlian, dan pengalaman kerja.",
  title: "Profil CV",
};

export default function Page() {
  return <CvPage />;
}
