import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { landingRoute } from "@/lib/auth/landing";
import { resolveSession } from "@/lib/auth/route-gate";
import { SESSION_COOKIE } from "@/lib/constants/storage";

export const metadata: Metadata = {
  title: "Workload",
};

export default async function Page() {
  const session = resolveSession((await cookies()).get(SESSION_COOKIE)?.value);
  redirect(landingRoute(session?.accessRole));
}
