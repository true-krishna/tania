"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import {
  IconAlertCircle,
  IconArrowRight,
  IconBrandWindows,
  IconLock,
  IconMail,
} from "@tabler/icons-react";
import { EntraSsoStartDocument, LoginDocument } from "@/generated/graphql";
import {
  authConfig,
  clearSsoHints,
  isSsoFallbackMarked,
  isSsoUnlinked,
  markSsoFallback,
} from "@/lib/auth/config";
import { beginEntraAuthAttempt, type EntraAuthAttempt } from "@/features/auth/entra-pkce";
import { setSession } from "@/lib/auth/token-store";
import { DASHBOARD } from "@/lib/constants/routes";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Brand } from "@/components/Brand";
import { BrandPanel } from "./BrandPanel";

/**
 * Login — TAN-191 redesign on canon tokens (constitution-design v4.3.1), now
 * SSO-first (006-entra-sso-login, D8 "opsi A").
 *
 * Owner direction (unchanged from TAN-191): the page must read brand-red first,
 * so the primary action fills `--tp-brand-red` (hover/press
 * `--tp-brand-red-deep`, white text 4.7:1) instead of the navy default — a
 * recorded §II deviation scoped to this page. The important-modifier overrides
 * exist because the unlayered `.tp-*` classes beat layered Tailwind utilities
 * regardless of specificity. Danger keeps its dedicated tokens (tint + ink +
 * icon, §IX) and never reuses brand red.
 *
 * SSO behaviour (contracts/sso-entra.md §4/§8, FR-001/FR-002/FR-009):
 *
 * - On mount we build a PKCE attempt (verifier/state/nonce, T022) and ask
 *   `entraSsoStart`. Only when the backend answers `enabled: true` **and** no
 *   browser hint is set (T023) does the page hand the browser to Microsoft,
 *   exactly once. Hints are read after mount, never during render, so the
 *   server-rendered shell cannot disagree with the browser.
 * - The email + password door is always one click away and never hidden behind
 *   a failure: while SSO is offered it is a visible secondary action, and when
 *   SSO is inactive or unavailable the form is what the page shows (quickstart
 *   §A.2: no dangling SSO button). Choosing it sets the fallback hint, so the
 *   auto-redirect cannot run again and no redirect loop is possible.
 * - Returning with `?sso=error|cancelled` sets the same hint and explains what
 *   happened in Indonesian; the backend's messages (D11) are shown verbatim.
 */
export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnReason = searchParams.get("sso");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [login, { loading }] = useMutation(LoginDocument);

  // The PKCE attempt must exist before `entraSsoStart` can be called, because
  // the challenge/state/nonce are its arguments. One attempt per page visit.
  const [attempt, setAttempt] = React.useState<EntraAuthAttempt | null>(null);
  const [codeChallenge, setCodeChallenge] = React.useState<string | null>(null);
  // Browser hint: while set, the auto-redirect stays off (D8). Read once at
  // mount — the page is client-only (ssr:false) and the helpers below are no-ops
  // when Web Storage is blocked, so this never breaks the email path.
  const [emailDoorChosen, setEmailDoorChosen] = React.useState(
    () => isSsoFallbackMarked() || isSsoUnlinked(),
  );
  const handedOver = React.useRef(false);

  React.useEffect(() => {
    if (authConfig.localOnly) return;
    let cancelled = false;
    beginEntraAuthAttempt()
      .then((started) => {
        if (cancelled) return;
        setAttempt(started.attempt);
        setCodeChallenge(started.codeChallenge);
      })
      .catch(() => {
        // Web Crypto unavailable (insecure context): SSO stays off, the email
        // path below is unaffected.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (authConfig.localOnly) router.replace(DASHBOARD);
  }, [router]);

  React.useEffect(() => {
    // A return from Microsoft also sets the hint, so a later reload without the
    // query string still lands on the email door.
    if (returnReason === "cancelled" || returnReason === "error") markSsoFallback();
  }, [returnReason]);

  const { data, error: ssoError } = useQuery(EntraSsoStartDocument, {
    skip: authConfig.localOnly || !attempt || !codeChallenge,
    variables: {
      codeChallenge: codeChallenge ?? "",
      state: attempt?.state ?? "",
      nonce: attempt?.nonce ?? "",
    },
  });

  const authorizationUrl = data?.entraSsoStart?.enabled
    ? (data.entraSsoStart.authorizationUrl ?? null)
    : null;
  const returnMessage =
    returnReason === "cancelled"
      ? "Masuk dengan Microsoft dibatalkan. Anda dapat mencoba lagi atau masuk dengan email & kata sandi."
      : returnReason === "error"
        ? "Masuk dengan Microsoft gagal. Silakan coba lagi atau masuk dengan email & kata sandi."
        : null;
  // Hint set, or a return from Microsoft → the email door, never a redirect.
  const emailDoor = emailDoorChosen || returnMessage !== null;
  // No usable authorization URL → the email form is what the visitor sees.
  const showEmailForm = !authorizationUrl || emailDoor;

  React.useEffect(() => {
    if (handedOver.current || !authorizationUrl || emailDoor) return;
    handedOver.current = true;
    window.location.replace(authorizationUrl);
  }, [authorizationUrl, emailDoor]);

  function goToMicrosoft() {
    if (!authorizationUrl || handedOver.current) return;
    handedOver.current = true;
    window.location.replace(authorizationUrl);
  }

  function chooseEmailDoor() {
    markSsoFallback();
    setEmailDoorChosen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const { data } = await login({
        variables: {
          input: { email: email.trim(), password },
        },
      });
      if (!data?.login) {
        setError("Autentikasi gagal.");
        return;
      }
      const { accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt, user } =
        data.login;
      setSession({
        accessToken,
        accessTokenExpiresAt,
        refreshToken,
        refreshTokenExpiresAt,
        accessRole: user.accessRole,
        fullName: user.fullName,
        email: user.email,
      });
      // A successful sign-in on either path clears the SSO hints (D8).
      clearSsoHints();
      router.replace(DASHBOARD);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setError(message);
    }
  }

  if (authConfig.localOnly) return null;

  return (
    <main lang="id" className="flex min-h-screen w-full">
      <BrandPanel />

      <section className="flex w-full items-center justify-center bg-tp-bg px-6 py-12 lg:w-1/2 lg:px-10">
        <div className="flex w-full max-w-[440px] flex-col">
          <div className="lg:hidden">
            <Brand variant="small" className="text-[40px]" />
          </div>

          <p className="mt-8 text-[13px] font-semibold text-tp-brand-red-deep lg:mt-0">
            Selamat datang kembali
          </p>

          <h1 className="mt-2 text-[30px] font-bold leading-[1.2] text-tp-text">
            Masuk ke TANIA
          </h1>

          {showEmailForm ? (
            <>
              <p className="mt-4 text-sm leading-[1.6] text-tp-muted">
                Masuk dengan email & kata sandi akun Tania Anda.
              </p>

              {returnMessage ? (
                <p
                  role="alert"
                  className="mt-6 flex items-start gap-2.5 rounded-tp-md bg-tp-tint-peach px-4 py-3 text-sm font-semibold text-tp-ink-peach"
                >
                  <IconAlertCircle
                    aria-hidden="true"
                    className="mt-0.5 h-4.5 w-4.5 shrink-0"
                  />
                  {returnMessage}
                </p>
              ) : null}

              <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="login-email"
                    className="text-sm font-semibold text-tp-text"
                  >
                    Email kerja
                  </label>
                  <IconField icon={<IconMail />}>
                    <Input
                      id="login-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      placeholder="nama@perusahaan.com"
                      className="h-12 pl-12!"
                    />
                  </IconField>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="login-password"
                    className="text-sm font-semibold text-tp-text"
                  >
                    Password
                  </label>
                  <IconField icon={<IconLock />}>
                    <Input
                      id="login-password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      placeholder="Masukkan password"
                      className="h-12 pl-12!"
                    />
                  </IconField>
                </div>

                {error ? (
                  <p
                    role="alert"
                    className="flex items-start gap-2.5 rounded-tp-md bg-tp-tint-peach px-4 py-3 text-sm font-semibold text-tp-ink-peach"
                  >
                    <IconAlertCircle
                      aria-hidden="true"
                      className="mt-0.5 h-4.5 w-4.5 shrink-0"
                    />
                    {error}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-2 h-13 w-full justify-center bg-tp-brand-red! border-tp-brand-red! hover:bg-tp-brand-red-deep! hover:border-tp-brand-red-deep! active:bg-tp-brand-red-deep! active:border-tp-brand-red-deep!"
                >
                  {loading ? "Memproses…" : "Masuk ke workspace"}
                  <IconArrowRight aria-hidden="true" className="h-5 w-5 shrink-0" />
                </Button>
              </form>

              {ssoError ? (
                <p role="status" className="mt-4 text-sm text-tp-muted">
                  Masuk dengan Microsoft sedang tidak tersedia. Silakan masuk
                  dengan email & kata sandi.
                </p>
              ) : null}

              {authorizationUrl ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={goToMicrosoft}
                  className="mt-4 h-12 w-full justify-center"
                >
                  <IconBrandWindows aria-hidden="true" className="h-5 w-5 shrink-0" />
                  Masuk dengan Microsoft
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <p className="mt-4 text-sm leading-[1.6] text-tp-muted">
                Gunakan akun korporat Telkom Anda. Kami mengalihkan Anda ke
                halaman masuk Microsoft.
              </p>

              <div className="mt-8 flex flex-col gap-4">
                <Button
                  type="button"
                  onClick={goToMicrosoft}
                  className="h-13 w-full justify-center bg-tp-brand-red! border-tp-brand-red! hover:bg-tp-brand-red-deep! hover:border-tp-brand-red-deep! active:bg-tp-brand-red-deep! active:border-tp-brand-red-deep!"
                >
                  <IconBrandWindows aria-hidden="true" className="h-5 w-5 shrink-0" />
                  Masuk dengan Microsoft
                </Button>

                {/* Always visible, never only after a failure (D8 (i)): an
                    account without a corporate identity must have an exit. */}
                <button
                  type="button"
                  onClick={chooseEmailDoor}
                  className="self-center text-sm font-semibold text-tp-brand-red-deep underline underline-offset-4 hover:text-tp-brand-red-ink"
                >
                  Masuk dengan email & kata sandi
                </button>
              </div>

              <p role="status" className="mt-6 text-sm text-tp-muted">
                Mengalihkan ke Microsoft…
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

/**
 * Decorative 24px outline glyph inside a canon `.tp-input` field.
 *
 * The field itself must reserve the gutter with `pl-12!`: `.tp-input` sets
 * `padding: 0 16px` from an unlayered stylesheet, and unlayered declarations
 * beat layered Tailwind utilities regardless of specificity — without the
 * important modifier the glyph sits on top of the placeholder text.
 */
function IconField({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-tp-muted [&>svg]:h-5 [&>svg]:w-5"
      >
        {icon}
      </span>
      {children}
    </div>
  );
}
