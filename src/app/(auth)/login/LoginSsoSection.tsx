"use client";

import { IconBrandWindows } from "@tabler/icons-react";
import { Button } from "@/components/Button";

export function LoginSsoSection({
  authorizationUrl,
  pending,
  failed,
  onContinue,
}: {
  authorizationUrl: string | null;
  pending: boolean;
  failed: boolean;
  onContinue: () => void;
}) {
  if (authorizationUrl) {
    return (
      <Button className="h-12 w-full justify-center" onClick={onContinue} variant="secondary">
        <IconBrandWindows aria-hidden="true" className="h-5 w-5 shrink-0" />
        Masuk dengan SSO Telkom
      </Button>
    );
  }

  if (pending) {
    return (
      <p className="text-center text-sm text-tp-muted" role="status">
        Memeriksa opsi masuk SSO…
      </p>
    );
  }

  if (failed) {
    return (
      <p className="text-center text-sm text-tp-muted" role="status">
        Masuk dengan SSO Telkom sedang tidak tersedia. Silakan masuk dengan email &amp; kata sandi.
      </p>
    );
  }

  return null;
}
