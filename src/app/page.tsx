import { redirect } from "next/navigation";
import { DASHBOARD } from "@/lib/constants/routes";

export default function Home() {
  redirect(DASHBOARD);
}
