import type { Metadata } from "next";
import { getPosts } from "@/app/lib/api";
import { PostList } from "@/app/components/blog/PostList";

export const metadata: Metadata = {
  title: "Posts",
  description: "Lista de posts publicados no blog.",
};

type HomePageProps = {
  searchParams: Promise<{
    page?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const response = await getPosts({ page: params.page });

  return (
    <section className="mx-auto max-w-listing px-4 py-12">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-secondary">
          Publicacoes recentes
        </p>
        <h1 className="mt-3 text-4xl font-bold text-primary">Blog</h1>
      </div>
      <PostList posts={response.posts} pagination={response.pagination} />
    </section>
  );
}
