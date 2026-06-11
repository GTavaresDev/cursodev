import Link from "next/link";
import type { Pagination, BlogPostSummary } from "@/types/blog";
import { PostCard } from "./PostCard";

type PostListProps = {
  posts: BlogPostSummary[];
  pagination?: Pagination;
  basePath?: string;
};

export function PostList({ posts, pagination, basePath = "/" }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[rgb(var(--color-border))] bg-surface p-8 text-center text-muted">
        Nenhum post publicado por enquanto.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {pagination && pagination.total_pages > 1 ? (
        <nav className="flex items-center justify-between pt-2 text-sm">
          {pagination.page > 1 ? (
            <Link
              className="rounded-md border border-[rgb(var(--color-border))] px-4 py-2 text-primary"
              href={`${basePath}?page=${pagination.page - 1}`}
            >
              Anteriores
            </Link>
          ) : (
            <span />
          )}

          <span className="text-muted">
            Pagina {pagination.page} de {pagination.total_pages}
          </span>

          {pagination.page < pagination.total_pages ? (
            <Link
              className="rounded-md border border-[rgb(var(--color-border))] px-4 py-2 text-primary"
              href={`${basePath}?page=${pagination.page + 1}`}
            >
              Proximos
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
