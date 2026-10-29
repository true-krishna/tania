import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { IDP } from "@/lib/constants/routes";

export const metadata: Metadata = {
  title: "IDP",
};

export default function NewIdpPage() {
  redirect(IDP);
}
