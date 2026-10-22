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

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnReason = searchParams.get("sso");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [login, { loading }] = useMutation(LoginDocument);

  const [attempt, setAttempt] = React.useState<EntraAuthAttempt | null>(null);
  const [codeChallenge, setCodeChallenge] = React.useState<string | null>(null);
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
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (authConfig.localOnly) router.replace(DASHBOARD);
  }, [router]);

  React.useEffect(() => {
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
  const emailDoor = emailDoorChosen || returnMessage !== null;
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
      clearSsoHints();
      router.replace(DASHBOARD);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setError(message);
    }
  }

  if (authConfig.localOnly) return null;

  return (
    <main className="flex min-h-screen w-full" lang="id">
      <BrandPanel />

      <section className="flex w-full items-center justify-center bg-tp-bg px-6 py-12 lg:w-1/2 lg:px-10">
        <div className="flex w-full max-w-[440px] flex-col">
          <div className="lg:hidden">
            <Brand className="text-[40px]" variant="small" />
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
                  className="mt-6 flex items-start gap-2.5 rounded-tp-md bg-tp-tint-peach px-4 py-3 text-sm font-semibold text-tp-ink-peach"
                  role="alert"
                >
                  <IconAlertCircle
                    aria-hidden="true"
                    className="mt-0.5 h-4.5 w-4.5 shrink-0"
                  />
                  {returnMessage}
                </p>
              ) : null}

              <form className="mt-8 flex flex-col gap-5" onSubmit={onSubmit}>
                <div className="flex flex-col gap-2">
                  <label
                    className="text-sm font-semibold text-tp-text"
                    htmlFor="login-email"
                  >
                    Email kerja
                  </label>
                  <IconField icon={<IconMail />}>
                    <Input
                      autoComplete="email"
                      className="h-12 pl-12!"
                      id="login-email"
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@perusahaan.com"
                      required
                      type="email"
                      value={email}
                    />
                  </IconField>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    className="text-sm font-semibold text-tp-text"
                    htmlFor="login-password"
                  >
                    Password
                  </label>
                  <IconField icon={<IconLock />}>
                    <Input
                      autoComplete="current-password"
                      className="h-12 pl-12!"
                      id="login-password"
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password"
                      required
                      type="password"
                      value={password}
                    />
                  </IconField>
                </div>

                {error ? (
                  <p
                    className="flex items-start gap-2.5 rounded-tp-md bg-tp-tint-peach px-4 py-3 text-sm font-semibold text-tp-ink-peach"
                    role="alert"
                  >
                    <IconAlertCircle
                      aria-hidden="true"
                      className="mt-0.5 h-4.5 w-4.5 shrink-0"
                    />
                    {error}
                  </p>
                ) : null}

                <Button
                  className="mt-2 h-13 w-full justify-center bg-tp-brand-red! border-tp-brand-red! hover:bg-tp-brand-red-deep! hover:border-tp-brand-red-deep! active:bg-tp-brand-red-deep! active:border-tp-brand-red-deep!"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? "Memproses…" : "Masuk ke workspace"}
                  <IconArrowRight aria-hidden="true" className="h-5 w-5 shrink-0" />
                </Button>
              </form>

              {ssoError ? (
                <p className="mt-4 text-sm text-tp-muted" role="status">
                  Masuk dengan Microsoft sedang tidak tersedia. Silakan masuk
                  dengan email & kata sandi.
                </p>
              ) : null}

              {authorizationUrl ? (
                <Button
                  className="mt-4 h-12 w-full justify-center"
                  onClick={goToMicrosoft}
                  type="button"
                  variant="secondary"
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
                  className="h-13 w-full justify-center bg-tp-brand-red! border-tp-brand-red! hover:bg-tp-brand-red-deep! hover:border-tp-brand-red-deep! active:bg-tp-brand-red-deep! active:border-tp-brand-red-deep!"
                  onClick={goToMicrosoft}
                  type="button"
                >
                  <IconBrandWindows aria-hidden="true" className="h-5 w-5 shrink-0" />
                  Masuk dengan Microsoft
                </Button>

                <button
                  className="self-center text-sm font-semibold text-tp-brand-red-deep underline underline-offset-4 hover:text-tp-brand-red-ink"
                  onClick={chooseEmailDoor}
                  type="button"
                >
                  Masuk dengan email & kata sandi
                </button>
              </div>

              <p className="mt-6 text-sm text-tp-muted" role="status">
                Mengalihkan ke Microsoft…
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

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
