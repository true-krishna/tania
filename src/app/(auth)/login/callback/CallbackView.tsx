"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@apollo/client";
import { IconAlertCircle } from "@tabler/icons-react";
import { LoginWithEntraDocument } from "@/generated/graphql";
import { clearSsoHints, markSsoFallback, markSsoUnlinked } from "@/lib/auth/config";
import { takeEntraAuthAttempt, type EntraAuthAttempt } from "@/features/auth/entra-pkce";
import { setSession } from "@/lib/auth/token-store";
import { DASHBOARD, LOGIN } from "@/lib/constants/routes";
import Link from "next/link";

/**
 * OIDC redirect target of the Microsoft Entra SSO flow
 * (006-entra-sso-login, T025 · contracts/sso-entra.md §4/§8).
 *
 * Microsoft sends the browser here with `?code=…&state=…`. The page:
 *
 * 1. verifies `state` against the attempt kept in `sessionStorage` (T022) —
 *    a mismatch (or a missing/one-time-consumed attempt) shows a clear message
 *    and **never** calls the backend, so a stray or replayed response cannot
 *    start an exchange;
 * 2. on `?error=…` (the user cancelled at Microsoft) returns to `/login` with
 *    the fallback hint set, instead of rendering a dead page;
 * 3. otherwise exchanges the code for a Tania session through `loginWithEntra`.
 *    The backend is the enforcement point (PKCE binding, ID-token validation,
 *    identity mapping); its Indonesian messages (D11) are shown verbatim, and a
 *    "not linked" rejection is remembered for 7 days so the next visit goes
 *    straight to the email form (D8 (ii)).
 */
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
      const {
        accessToken,
        accessTokenExpiresAt,
        refreshToken,
        refreshTokenExpiresAt,
        user,
      } = data.loginWithEntra;
      setSession({
        accessToken,
        accessTokenExpiresAt,
        refreshToken,
        refreshTokenExpiresAt,
        accessRole: user.accessRole,
        fullName: user.fullName,
        email: user.email,
      });
      clearSsoHints();
      router.replace(DASHBOARD);
    } catch (err) {
      if (isUnlinkedRejection(err)) markSsoUnlinked();
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Masuk dengan Microsoft gagal. Silakan coba lagi.";
      setError(message);
    }
  }

  async function settle() {
    if (searchParams.get("error")) {
      markSsoFallback();
      router.replace(`${LOGIN}?sso=cancelled`);
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
    // Once per page load: React's development double-invoke must not consume the
    // single-use attempt twice.
    if (started.current) return;
    started.current = true;
    void settle();
    // The exchange is deliberately a one-shot: `runExchange`/`settle` use the
    // router and the mutation only once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main lang="id" className="flex min-h-screen w-full items-center justify-center bg-tp-bg px-6 py-12">
      <div className="flex w-full max-w-[440px] flex-col items-center text-center">
        <h1 className="text-[30px] font-bold leading-[1.2] text-tp-text">
          Masuk ke TANIA
        </h1>

        {error ? (
          <p
            role="alert"
            className="mt-6 flex w-full items-start gap-2.5 rounded-tp-md bg-tp-tint-peach px-4 py-3 text-left text-sm font-semibold text-tp-ink-peach"
          >
            <IconAlertCircle
              aria-hidden="true"
              className="mt-0.5 h-4.5 w-4.5 shrink-0"
            />
            {error}
          </p>
        ) : (
          <p role="status" className="mt-6 text-sm text-tp-muted">
            {loading ? "Menyelesaikan masuk…" : "Memeriksa sesi masuk…"}
          </p>
        )}

        <Link
          href={LOGIN}
          className="mt-6 text-sm font-semibold text-tp-brand-red-deep underline underline-offset-4 hover:text-tp-brand-red-ink"
        >
          Kembali ke halaman masuk
        </Link>
      </div>
    </main>
  );
}

/**
 * True when the backend rejected the identity (contracts/sso-entra.md §4): the
 * generic `UNAUTHENTICATED` message covers "no matching Tania account" and
 * every other mapping failure. Those do not fix themselves on the next visit,
 * so D8 (ii) remembers them for 7 days. Transient failures
 * (`ENTRA_UNAVAILABLE`, `RATE_LIMITED`, `ENTRA_NOT_CONFIGURED`) are excluded —
 * there the user should be able to try Microsoft again.
 */
function isUnlinkedRejection(err: unknown): boolean {
  const graphQLErrors = (err as { graphQLErrors?: { extensions?: { code?: string } }[] })
    .graphQLErrors;
  return (
    Array.isArray(graphQLErrors) &&
    graphQLErrors.some((e) => e?.extensions?.code === "UNAUTHENTICATED")
  );
}
