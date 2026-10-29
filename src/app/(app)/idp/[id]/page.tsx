import type { Metadata } from "next";
import IdpDetailPage from "./IdpDetailPage";

export const metadata: Metadata = {
  title: "Detail IDP",
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <IdpDetailPage params={params} />;
}
