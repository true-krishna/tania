"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@apollo/client";
import { IconAlertCircle } from "@tabler/icons-react";
import { LoginWithEntraDocument } from "@/generated/graphql";
import { takeEntraAuthAttempt, type EntraAuthAttempt } from "@/features/auth/entra-pkce";
import { resetApolloStore } from "@/lib/apollo";
import { setSession } from "@/lib/auth/token-store";
import { landingRoute } from "@/lib/auth/landing";
import { LOGIN } from "@/lib/constants/routes";
import Link from "next/link";

export default function CallbackView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = React.useState<string | null>(null);
  const [exchange, { loading }] = useMutation(LoginWithEntraDocument);
  const started = React.useRef(false);

  async function runExchange(code: string, attempt: EntraAuthAttempt) {
    try {
      const { data } = await exchange({
        variables: {
          input: {
            code,
            codeVerifier: attempt.codeVerifier,
            nonce: attempt.nonce,
          },
        },
      });
      if (!data?.loginWithEntra) {
        setError("Sesi masuk tidak valid atau sudah kedaluwarsa. Silakan coba lagi.");
        return;
      }
      const { accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt, user } =
        data.loginWithEntra;
      setSession({
        accessToken,
        accessTokenExpiresAt,
        refreshToken,
        refreshTokenExpiresAt,
        accessRole: user.accessRole,
        roleName: user.roleName,
        fullName: user.fullName,
        email: user.email,
      });
      await resetApolloStore();
      router.replace(landingRoute(user.accessRole));
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Masuk dengan Microsoft gagal. Silakan coba lagi.";
      setError(message);
    }
  }

  async function settle() {
    const returnedError = searchParams.get("error");
    if (returnedError) {
      router.replace(`${LOGIN}?sso=cancelled&entra=${encodeURIComponent(returnedError)}`);
      return;
    }

    const code = searchParams.get("code");
    const returnedState = searchParams.get("state");
    const attempt = takeEntraAuthAttempt();
    if (!code || !attempt || attempt.state !== returnedState) {
      setError("Sesi masuk tidak valid atau sudah kedaluwarsa. Silakan coba lagi.");
      return;
    }
    await runExchange(code, attempt);
  }

  React.useEffect(() => {
    if (started.current) return;
    started.current = true;
    void settle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main
      className="flex min-h-screen w-full items-center justify-center bg-tp-bg px-6 py-12"
      lang="id"
    >
      <div className="flex w-full max-w-[440px] flex-col items-center text-center">
        <h1 className="text-[30px] font-bold leading-[1.2] text-tp-text">Masuk ke TANIA</h1>

        {error ? (
          <p
            className="mt-6 flex w-full items-start gap-2.5 rounded-tp-md bg-tp-tint-peach px-4 py-3 text-left text-sm font-semibold text-tp-ink-peach"
            role="alert"
          >
            <IconAlertCircle aria-hidden="true" className="mt-0.5 h-4.5 w-4.5 shrink-0" />
            {error}
          </p>
        ) : (
          <p className="mt-6 text-sm text-tp-muted" role="status">
            {loading ? "Menyelesaikan masuk…" : "Memeriksa sesi masuk…"}
          </p>
        )}

        <Link
          className="mt-6 text-sm font-semibold text-tp-brand-red-deep underline underline-offset-4 hover:text-tp-brand-red-ink"
          href={LOGIN}
        >
          Kembali ke halaman masuk
        </Link>
      </div>
    </main>
  );
}
