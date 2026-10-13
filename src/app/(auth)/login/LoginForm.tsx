"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client";
import { IconArrowRight, IconLock, IconMail } from "@tabler/icons-react";
import { LoginDocument } from "@/generated/graphql";
import { authConfig } from "@/lib/auth/config";
import { setSession } from "@/lib/auth/token-store";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { BrandPanel } from "./BrandPanel";

/**
 * Login form — mockup structure (TAN-160) on canon tokens (constitution-design
 * v4.0.0). The mockup's navy/red palette and its uppercase eyebrows are
 * translated (see the issue comment for the recorded deviations): colors come
 * from `--tp-*`, action copy is sentence case (§III), and every interactive
 * element keeps the shipped focus ring (§VI).
 *
 * The mockup ships no social sign-in, so the vendor-color SSO icons and the
 * illustrated promo art are gone; SSO remains deferred (plan.md R3). Copy is
 * the owner's revision from the TAN-160 review: no invite-only caveat, no
 * pending-invite notice and no admin-contact affordance.
 */
export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [login, { loading }] = useMutation(LoginDocument);

  React.useEffect(() => {
    if (authConfig.localOnly) router.replace("/dashboard");
  }, [router]);

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
      router.replace("/dashboard");
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
        <div className="flex w-full max-w-[560px] flex-col">
          <p className="text-[13px] font-semibold text-tp-ink-violet">
            Selamat datang kembali
          </p>

          <h1 className="mt-2 text-[30px] font-bold leading-[1.2] text-tp-text">
            Masuk ke TANIA
          </h1>

          <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-4">
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
                  className="h-14 pl-12!"
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
                  className="h-14 pl-12!"
                />
              </IconField>
            </div>

            {error ? (
              <p className="text-sm text-tp-ink-peach" role="alert">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={loading}
              className="mt-1 h-14 w-full justify-center text-[15px]"
            >
              {loading ? "Memproses…" : "Masuk ke workspace"}
              <IconArrowRight aria-hidden="true" className="h-5 w-5" />
            </Button>
          </form>
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
