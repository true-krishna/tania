"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client";
import { LoginDocument } from "@/generated/graphql";
import { authConfig } from "@/lib/auth/config";
import { setSession } from "@/lib/auth/token-store";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { FacebookIcon, GoogleIcon, VictoryHandIcon } from "./icons";
import { PromoPanel } from "./PromoPanel";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [login, { loading }] = useMutation(LoginDocument);

  React.useEffect(() => {
    if (authConfig.localOnly) router.replace("/dashboard");
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      const { data } = await login({
        variables: {
          input: { email: email.trim(), password },
        },
      });
      if (!data?.login) {
        setError("Authentication failed.");
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
      const message = err instanceof Error ? err.message : "An error occurred.";
      setError(message);
    }
  }

  if (authConfig.localOnly) return null;

  return (
    <main className="flex min-h-screen w-full bg-white">
      <section className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto flex w-full max-w-[360px] flex-col">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-zinc-900">
            Login <VictoryHandIcon className="h-7 w-7" />
          </h1>
          <p className="mt-2 text-base text-zinc-600">
            Sign in with your Tania account to continue.
          </p>

          <div className="mt-7 flex flex-col gap-3">
            <SocialButton
              icon={<GoogleIcon />}
              label="Sign in with Google"
              onClick={() => setNotice("Social sign-in is not available yet — use your email and password.")}
            />
            <SocialButton
              icon={<FacebookIcon />}
              label="Sign in with Facebook"
              onClick={() => setNotice("Social sign-in is not available yet — use your email and password.")}
            />
          </div>

          {notice ? (
            <p className="mt-3 text-sm text-zinc-600" role="status">
              {notice}
            </p>
          ) : null}

          <div className="my-5 flex items-center gap-3 text-sm text-zinc-500">
            <span className="h-px flex-1 bg-zinc-200" />
            or Sign in with Email
            <span className="h-px flex-1 bg-zinc-200" />
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-sm font-semibold text-zinc-800">
                Email
              </label>
              <Input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                className="h-11 rounded-full border-zinc-300 px-4"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-sm font-semibold text-zinc-800">
                Password
              </label>
              <Input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Enter your Password"
                className="h-11 rounded-full border-zinc-300 px-4"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setNotice("Password reset is not available yet — contact your administrator.")
                }
                className="text-sm font-medium text-brand hover:text-brand-600"
              >
                Forget Password?
              </button>
            </div>

            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full justify-center rounded-full bg-linear-to-r from-brand to-brand-600 text-sm font-semibold hover:from-brand-600 hover:to-brand-700"
            >
              {loading ? "Signing in…" : "Login"}
            </Button>
          </form>

          <p className="mt-7 text-xs text-zinc-500">
            © 2026 Tania — Telkom Digital. All rights reserved.
          </p>
        </div>
      </section>

      <PromoPanel />
    </main>
  );
}

/**
 * Social sign-in is shown for design parity with the reference, but the Tania
 * backend only serves local email/password auth today (SSO is deferred). The
 * button therefore reports its unavailability rather than pretending to work.
 */
function SocialButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-full border border-zinc-300 bg-white text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50"
    >
      {icon}
      {label}
    </button>
  );
}