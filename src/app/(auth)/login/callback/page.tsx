"use client";

import dynamic from "next/dynamic";

// Same reason as /login: the callback uses `useMutation` (Apollo), which needs a
// client, so it renders only in the browser (ssr:false) and the route stays
// prerender-safe at build time without a GraphQL endpoint.
const CallbackView = dynamic(() => import("./CallbackView"), { ssr: false });

export default function LoginCallbackPage() {
  return <CallbackView />;
}
