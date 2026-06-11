import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse sua conta.",
};

export default function LoginPage() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-12rem)] max-w-listing items-center gap-8 px-4 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
      <div>
        <p className="text-sm font-semibold uppercase tracking-normal text-secondary">
          Area de acesso
        </p>
        <h1 className="mt-3 max-w-xl text-4xl font-bold text-primary">
          Entre para continuar sua sessao
        </h1>
        <p className="mt-5 max-w-lg text-lg leading-8 text-muted">
          Use o email e a senha cadastrados para acessar sua conta.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="rounded-lg border border-[rgb(var(--color-border))] bg-surface p-8">
            <div className="skeleton h-6 w-40 rounded-md" />
            <div className="skeleton mt-6 h-12 rounded-md" />
            <div className="skeleton mt-4 h-12 rounded-md" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </section>
  );
}
