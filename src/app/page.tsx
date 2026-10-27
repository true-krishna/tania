"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSessionRole } from "@/lib/auth/guard";
import { landingRoute } from "@/lib/auth/landing";

export default function Home() {
  const router = useRouter();
  const role = useSessionRole();

  React.useEffect(() => {
    router.replace(landingRoute(role));
  }, [router, role]);

  return null;
}
