import type { Metadata } from "next";
import ContractDetailPage from "./ContractDetailPage";

export const metadata: Metadata = {
  title: "Detail Kontrak",
};

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <ContractDetailPage params={params} />;
}
