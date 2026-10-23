import { redirect } from "next/navigation";
import { CONTRACTS } from "@/lib/constants/routes";

export default function NewContractRedirect() {
  redirect(CONTRACTS);
}
