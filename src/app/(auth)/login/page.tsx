"use client";

import dynamic from "next/dynamic";

// Login form uses useMutation (Apollo) which needs a client — render it only
// in the browser (ssr:false) so the login page can be safely prerendered at
// build time without a GraphQL endpoint. Plan.md R3: SSO follows in W8.
const LoginForm = dynamic(() => import("./LoginForm"), { ssr: false });

export default function LoginPage() {
  return <LoginForm />;
}