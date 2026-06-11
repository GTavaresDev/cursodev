import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryPosts } from "@/app/lib/api";
import { PostList } from "@/app/components/blog/PostList";

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
};

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const response = await getCategoryPosts({ slug });

  if (!response) {
    return {
      title: "Categoria nao encontrada",
    };
  }

  return {
    title: response.category.name,
    description: response.category.description ?? response.category.name,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const response = await getCategoryPosts({ slug, page: query.page });

  if (!response) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-listing px-4 py-12">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-secondary">
          Categoria
        </p>
        <h1 className="mt-3 text-4xl font-bold text-primary">
          {response.category.name}
        </h1>
        {response.category.description ? (
          <p className="mt-4 max-w-reading text-lg leading-8 text-muted">
            {response.category.description}
          </p>
        ) : null}
      </div>
      <PostList
        basePath={`/categories/${response.category.slug}`}
        pagination={response.pagination}
        posts={response.posts}
      />
    </section>
  );
}
