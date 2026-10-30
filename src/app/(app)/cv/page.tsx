import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveSession } from "@/lib/auth/route-gate";
import { EMPLOYEES, PROFILE } from "@/lib/constants/routes";
import { SESSION_COOKIE } from "@/lib/constants/storage";

export const metadata: Metadata = {
  title: "Profil CV",
};

export default async function Page() {
  const session = resolveSession((await cookies()).get(SESSION_COOKIE)?.value);
  redirect(session?.accessRole === "TALENT" ? PROFILE : EMPLOYEES);
}
