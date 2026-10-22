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
import { authConfig } from "@/lib/auth/config";
import { beginEntraAuthAttempt, type EntraAuthAttempt } from "@/features/auth/entra-pkce";
import { setSession } from "@/lib/auth/token-store";
import { DASHBOARD } from "@/lib/constants/routes";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Brand } from "@/components/Brand";
import { BrandPanel } from "./BrandPanel";

type View = "pending" | "sso" | "email";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnReason = searchParams.get("sso");
  const entraCode =
    (searchParams.get("entra") ?? "").replace(/[^\w.-]/g, "").slice(0, 40) || null;
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [login, { loading }] = useMutation(LoginDocument);
  const [attempt, setAttempt] = React.useState<EntraAuthAttempt | null>(null);
  const [codeChallenge, setCodeChallenge] = React.useState<string | null>(null);
  const [startFailed, setStartFailed] = React.useState(false);
  const [emailFormOpen, setEmailFormOpen] = React.useState(false);

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
        if (cancelled) return;
        setStartFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (authConfig.localOnly) router.replace(DASHBOARD);
  }, [router]);

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
      ? `Masuk dengan Microsoft dibatalkan${entraCode ? ` (${entraCode})` : ""}. Bila akses ke aplikasi Tania sudah seharusnya ada, hubungi Admin — atau masuk dengan email & kata sandi.`
      : returnReason === "error"
        ? "Masuk dengan Microsoft gagal. Silakan coba lagi atau masuk dengan email & kata sandi."
        : null;
  const ssoPending = !authConfig.localOnly && !startFailed && !data && !ssoError;
  const view: View = emailFormOpen
    ? "email"
    : authorizationUrl
      ? "sso"
      : ssoPending
        ? "pending"
        : "email";

  function continueWithMicrosoft() {
    if (!authorizationUrl) return;
    window.location.assign(authorizationUrl);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const { data: loginData } = await login({
        variables: {
          input: { email: email.trim(), password },
        },
      });
      if (!loginData?.login) {
        setError("Autentikasi gagal.");
        return;
      }
      const { accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt, user } =
        loginData.login;
      setSession({
        accessToken,
        accessTokenExpiresAt,
        refreshToken,
        refreshTokenExpiresAt,
        accessRole: user.accessRole,
        fullName: user.fullName,
        email: user.email,
      });
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

          {returnMessage ? (
            <p
              className="mt-6 flex items-start gap-2.5 rounded-tp-md bg-tp-tint-peach px-4 py-3 text-sm font-semibold text-tp-ink-peach"
              role="alert"
            >
              <IconAlertCircle aria-hidden="true" className="mt-0.5 h-4.5 w-4.5 shrink-0" />
              {returnMessage}
            </p>
          ) : null}

          {view === "pending" ? (
            <p className="mt-8 text-sm text-tp-muted" role="status">
              Memeriksa opsi masuk…
            </p>
          ) : null}

          {view === "sso" ? (
            <>
              <p className="mt-4 text-sm leading-[1.6] text-tp-muted">
                Gunakan akun korporat Telkom Anda. Kami akan membuka halaman masuk
                Microsoft.
              </p>

              <div className="mt-8 flex flex-col gap-4">
                <Button
                  className="h-13 w-full justify-center bg-tp-brand-red! border-tp-brand-red! hover:bg-tp-brand-red-deep! hover:border-tp-brand-red-deep! active:bg-tp-brand-red-deep! active:border-tp-brand-red-deep!"
                  onClick={continueWithMicrosoft}
                  type="button"
                >
                  <IconBrandWindows aria-hidden="true" className="h-5 w-5 shrink-0" />
                  Continue with Microsoft
                </Button>

                <button
                  className="self-center text-sm font-semibold text-tp-brand-red-deep underline underline-offset-4 hover:text-tp-brand-red-ink"
                  onClick={() => setEmailFormOpen(true)}
                  type="button"
                >
                  Login by Email
                </button>

              </div>
            </>
          ) : null}

          {view === "email" ? (
            <>
              <p className="mt-4 text-sm leading-[1.6] text-tp-muted">
                Masuk dengan email & kata sandi akun Tania Anda.
              </p>

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
            </>
          ) : null}
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
