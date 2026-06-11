import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-reading px-4 py-12">
      <div className="rounded-lg border border-[rgb(var(--color-border))] bg-surface p-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-secondary">
          404
        </p>
        <h1 className="mt-3 text-3xl font-bold text-primary">
          Conteudo nao encontrado.
        </h1>
        <p className="mt-4 text-muted">
          O item solicitado nao existe ou ainda nao esta publicado.
        </p>
        <Link
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-surface"
          href="/"
        >
          Voltar para posts
        </Link>
      </div>
    </section>
  );
}
