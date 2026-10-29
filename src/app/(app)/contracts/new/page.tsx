import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CONTRACTS } from "@/lib/constants/routes";

export const metadata: Metadata = {
  title: "Kontrak",
};

export default function NewContractRedirect() {
  redirect(CONTRACTS);
}
