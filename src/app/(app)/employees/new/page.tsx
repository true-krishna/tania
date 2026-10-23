"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { EMPLOYEES } from "@/lib/constants/routes";

export default function NewEmployeeRedirect() {
  const router = useRouter();
  React.useEffect(() => {
    router.replace(EMPLOYEES);
  }, [router]);
  return null;
}
