import { redirect } from "next/navigation";
import { IDP } from "@/lib/constants/routes";

export default function NewIdpPage() {
  redirect(IDP);
}
