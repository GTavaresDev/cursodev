import type { Metadata } from "next";
import Link from "next/link";
import { getCategories } from "@/app/lib/api";

export const metadata: Metadata = {
  title: "Categorias",
  description: "Categorias disponiveis no blog.",
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <section className="mx-auto max-w-listing px-4 py-12">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-secondary">
          Arquivo
        </p>
        <h1 className="mt-3 text-4xl font-bold text-primary">Categorias</h1>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[rgb(var(--color-border))] bg-surface p-8 text-center text-muted">
          Nenhuma categoria cadastrada por enquanto.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {categories.map((category) => (
            <Link
              className="rounded-lg border border-[rgb(var(--color-border))] bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
              href={`/categories/${category.slug}`}
              key={category.id}
            >
              <h2 className="text-xl font-semibold text-primary">
                {category.name}
              </h2>
              {category.description ? (
                <p className="mt-3 text-sm leading-6 text-muted">
                  {category.description}
                </p>
              ) : null}
              <p className="mt-4 text-sm text-secondary">
                {category.posts_count ?? 0} posts
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
