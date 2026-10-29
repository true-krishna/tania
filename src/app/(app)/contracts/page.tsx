import type { Metadata } from "next";
import ContractsPage from "./ContractsPage";

export const metadata: Metadata = {
  title: "Kontrak",
};

export default function Page() {
  return <ContractsPage />;
}
