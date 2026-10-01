"use client";

import dynamic from "next/dynamic";

// Form login memakai useMutation (Apollo) yang butuh client — render hanya di
// browser (ssr:false) agar halaman login aman di-prerender saat build tanpa
// endpoint GraphQL. Plan.md R3: SSO menyusul di W8, ini login lokal W0.
const LoginForm = dynamic(() => import("./LoginForm"), { ssr: false });

export default function LoginPage() {
  return <LoginForm />;
}