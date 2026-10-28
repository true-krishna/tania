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
import { useSessionRole } from "@/lib/auth/guard";
import { landingRoute } from "@/lib/auth/landing";
import { resetApolloStore } from "@/lib/apollo";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Brand } from "@/components/Brand";
import { BrandPanel } from "./BrandPanel";

export default function LoginForm() {
  const router = useRouter();
  const sessionRole = useSessionRole();
  const searchParams = useSearchParams();
  const returnReason = searchParams.get("sso");
  const entraCode =
    (searchParams.get("entra") ?? "").replace(/[^\w.-]/g, "").slice(0, 40) || null;
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [login, { loading }] = useMutation(LoginDocument);
  const [attempt, setAttempt] = React.useState<EntraAuthAttempt | null>(null);
  const [codeChallenge, setCodeChallenge] = React.useState<string | null>(null);
  const [startFailed, setStartFailed] = React.useState(false);

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
    if (authConfig.localOnly) router.replace(landingRoute(sessionRole));
  }, [router, sessionRole]);

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

  function continueWithSso() {
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
      setSession(
        {
          accessToken,
          accessTokenExpiresAt,
          refreshToken,
          refreshTokenExpiresAt,
          accessRole: user.accessRole,
          roleName: user.roleName,
          fullName: user.fullName,
          email: user.email,
        },
        { remember },
      );
      await resetApolloStore();
      router.replace(landingRoute(user.accessRole));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setError(message);
    }
  }

  if (authConfig.localOnly) return null;

  return (
    <main className="min-h-screen w-full bg-tp-sky-pale p-4 sm:p-6" lang="id">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 lg:min-h-[calc(100vh-3rem)] lg:flex-row lg:gap-8">
        <BrandPanel />

        <section className="flex w-full items-center justify-center py-6 lg:w-1/2 lg:py-10">
          <div className="w-full max-w-[520px] rounded-tp-lg bg-tp-surface p-6 shadow-card sm:p-8">
            <div className="lg:hidden">
              <Brand className="text-[28px]" variant="large" />
            </div>

            <h1 className="mt-6 text-[30px] font-bold leading-[1.2] text-tp-text lg:mt-0">
              Masuk
            </h1>

            <p className="mt-2 text-sm leading-[1.6] text-tp-muted">
              Gunakan email akun TANIA Anda.
            </p>

            {returnMessage ? (
              <p
                className="mt-6 flex items-start gap-2.5 rounded-tp-md bg-tp-tint-peach px-4 py-3 text-sm font-semibold text-tp-ink-peach"
                role="alert"
              >
                <IconAlertCircle aria-hidden="true" className="mt-0.5 h-4.5 w-4.5 shrink-0" />
                {returnMessage}
              </p>
            ) : null}

            <form className="mt-8 flex flex-col gap-5" onSubmit={onSubmit}>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-tp-text" htmlFor="login-email">
                  Email
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
                <label className="text-sm font-semibold text-tp-text" htmlFor="login-password">
                  Kata sandi
                </label>
                <IconField icon={<IconLock />}>
                  <Input
                    aria-describedby="login-password-hint"
                    autoComplete="current-password"
                    className="h-12 pl-12! pr-28!"
                    id="login-password"
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-tp-brand-red-deep"
                    onClick={() => setShowPassword((visible) => !visible)}
                    type="button"
                  >
                    {showPassword ? "Sembunyikan" : "Tampilkan"}
                  </button>
                </IconField>
                <p className="text-[13px] text-tp-muted" id="login-password-hint">
                  Minimal 12 karakter.
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm text-tp-text">
                <input
                  checked={remember}
                  className="size-4 accent-tp-brand-navy"
                  name="ingat-saya"
                  onChange={(e) => setRemember(e.target.checked)}
                  type="checkbox"
                />
                Ingat saya
              </label>

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

              <Button className="mt-2 h-12 w-full justify-center" disabled={loading} type="submit">
                {loading ? "Memproses…" : "Masuk"}
                <IconArrowRight aria-hidden="true" className="h-5 w-5 shrink-0" />
              </Button>
            </form>

            <div className="mt-6">
              {authorizationUrl ? (
                <Button
                  className="h-12 w-full justify-center"
                  onClick={continueWithSso}
                  variant="secondary"
                >
                  <IconBrandWindows aria-hidden="true" className="h-5 w-5 shrink-0" />
                  Masuk dengan SSO Telkom
                </Button>
              ) : ssoPending ? (
                <p className="text-center text-sm text-tp-muted" role="status">
                  Memeriksa opsi masuk SSO…
                </p>
              ) : ssoError ? (
                <p className="text-center text-sm text-tp-muted" role="status">
                  Masuk dengan SSO Telkom sedang tidak tersedia. Silakan masuk
                  dengan email &amp; kata sandi.
                </p>
              ) : null}

              <p className="mt-4 text-center text-[13px] text-tp-muted">
                Belum punya akses atau lupa kata sandi? Hubungi Admin.
              </p>
            </div>
          </div>
        </section>
      </div>
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