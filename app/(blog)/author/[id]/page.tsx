import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuthorPosts } from "@/app/lib/api";
import { AuthorAvatar } from "@/app/components/blog/AuthorAvatar";
import { PostList } from "@/app/components/blog/PostList";

type AuthorPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
};

export async function generateMetadata({
  params,
}: AuthorPageProps): Promise<Metadata> {
  const { id } = await params;
  const response = await getAuthorPosts({ id });

  if (!response) {
    return {
      title: "Autor nao encontrado",
    };
  }

  return {
    title: response.author.name,
    description: response.author.bio ?? `Posts de ${response.author.name}`,
  };
}

export default async function AuthorPage({
  params,
  searchParams,
}: AuthorPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const response = await getAuthorPosts({ id, page: query.page });

  if (!response) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-listing px-4 py-12">
      <div className="mb-8 flex items-start gap-4">
        <AuthorAvatar author={response.author} />
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-secondary">
            Autor
          </p>
          <h1 className="mt-2 text-4xl font-bold text-primary">
            {response.author.name}
          </h1>
          {response.author.bio ? (
            <p className="mt-4 max-w-reading text-lg leading-8 text-muted">
              {response.author.bio}
            </p>
          ) : null}
        </div>
      </div>
      <PostList
        basePath={`/author/${response.author.id}`}
        pagination={response.pagination}
        posts={response.posts}
      />
    </section>
  );
}
