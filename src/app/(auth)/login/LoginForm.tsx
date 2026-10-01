"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client";
import { LoginDocument } from "@/generated/graphql";
import { authConfig } from "@/lib/auth/config";
import { setSession } from "@/lib/auth/token-store";

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
        setError("Authentication failed.");
        return;
      }
      const { accessToken, accessTokenExpiresAt, user } = data.login;
      setSession({ accessToken, accessTokenExpiresAt, accessRole: user.accessRole });
      router.replace("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred.";
      setError(message);
    }
  }

  if (authConfig.localOnly) return null;

  return (
    <main className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center gap-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Sign in to Tania</h1>
        <p className="mt-1 text-sm text-zinc-600">Use your Tania account.</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            autoComplete="email"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            autoComplete="current-password"
          />
        </label>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}