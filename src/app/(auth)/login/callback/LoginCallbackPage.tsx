"use client";

import dynamic from "next/dynamic";

const CallbackView = dynamic(() => import("./CallbackView"), { ssr: false });

export default function LoginCallbackPage() {
  return <CallbackView />;
}
