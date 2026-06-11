"use client";

type ErrorPageProps = {
  error: Error;
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <section className="mx-auto max-w-reading px-4 py-12">
      <div className="rounded-lg border border-[rgb(var(--color-border))] bg-surface p-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-accent">
          Erro
        </p>
        <h1 className="mt-3 text-3xl font-bold text-primary">
          Nao foi possivel carregar esta pagina.
        </h1>
        <p className="mt-4 text-muted">{error.message}</p>
        <button
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-surface"
          onClick={reset}
          type="button"
        >
          Tentar novamente
        </button>
      </div>
    </section>
  );
}
