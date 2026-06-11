"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ApiError = {
  message?: string;
  action?: string;
};

type User = {
  id: string;
  email: string;
  username: string;
};

function getSafeRedirect(path: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/";
  }

  return path;
}

async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as ApiError;
    return [body.message, body.action].filter(Boolean).join(" ");
  } catch {
    return "Nao foi possivel entrar. Tente novamente.";
  }
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirect(searchParams?.get("next") ?? null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/v1/sessions", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!isMounted) {
          return;
        }

        if (response.ok) {
          setCurrentUser((await response.json()) as User);
        }
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setError(await readApiError(response));
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError("Nao foi possivel conectar ao servidor. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignOut() {
    setError("");
    setIsSigningOut(true);

    try {
      await fetch("/api/v1/sessions", {
        method: "DELETE",
        credentials: "include",
      });
      setCurrentUser(null);
      router.refresh();
    } catch {
      setError("Nao foi possivel encerrar a sessao. Tente novamente.");
    } finally {
      setIsSigningOut(false);
    }
  }

  if (isCheckingSession) {
    return (
      <div className="rounded-lg border border-[rgb(var(--color-border))] bg-surface p-8">
        <div className="skeleton h-6 w-40 rounded-md" />
        <div className="skeleton mt-6 h-12 rounded-md" />
        <div className="skeleton mt-4 h-12 rounded-md" />
      </div>
    );
  }

  if (currentUser) {
    return (
      <div className="rounded-lg border border-[rgb(var(--color-border))] bg-surface p-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-secondary">
          Sessao ativa
        </p>
        <h1 className="mt-3 text-3xl font-bold text-primary">
          {currentUser.username}
        </h1>
        <p className="mt-3 text-base leading-7 text-muted">
          {currentUser.email}
        </p>
        {error ? (
          <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-surface transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSigningOut}
            onClick={() => router.push(redirectTo)}
            type="button"
          >
            Continuar
          </button>
          <button
            className="rounded-md border border-[rgb(var(--color-border))] px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSigningOut}
            onClick={handleSignOut}
            type="button"
          >
            {isSigningOut ? "Saindo..." : "Sair"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="rounded-lg border border-[rgb(var(--color-border))] bg-surface p-8"
      onSubmit={handleSubmit}
    >
      <div>
        <label className="text-sm font-semibold text-primary" htmlFor="email">
          Email
        </label>
        <input
          autoComplete="email"
          className="mt-2 w-full rounded-md border border-[rgb(var(--color-border))] bg-transparent px-4 py-3 text-base text-primary outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20"
          id="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>

      <div className="mt-5">
        <label
          className="text-sm font-semibold text-primary"
          htmlFor="password"
        >
          Senha
        </label>
        <input
          autoComplete="current-password"
          className="mt-2 w-full rounded-md border border-[rgb(var(--color-border))] bg-transparent px-4 py-3 text-base text-primary outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20"
          id="password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </div>

      {error ? (
        <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        className="mt-8 w-full rounded-md bg-primary px-5 py-3 text-sm font-semibold text-surface transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
