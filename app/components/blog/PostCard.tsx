import Link from "next/link";
import type { BlogPostSummary } from "@/types/blog";
import { formatDate, plainTextExcerpt } from "@/app/lib/utils";
import { AuthorAvatar } from "./AuthorAvatar";
import { CategoryBadge } from "./CategoryBadge";
import { TagList } from "./TagList";

type PostCardProps = {
  post: BlogPostSummary;
};

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="rounded-lg border border-[rgb(var(--color-border))] bg-surface p-6 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="mb-4 flex items-center justify-between gap-4">
        <CategoryBadge category={post.category} />
        <time className="text-sm text-muted" dateTime={post.published_at ?? ""}>
          {formatDate(post.published_at)}
        </time>
      </div>

      <Link href={`/posts/${post.slug}`}>
        <h2 className="text-2xl font-bold leading-tight text-primary">
          {post.title}
        </h2>
      </Link>

      <p className="mt-4 text-base leading-7 text-muted">
        {post.excerpt ?? plainTextExcerpt(post.title)}
      </p>

      <div className="mt-6 flex items-center justify-between gap-4">
        {post.author ? (
          <Link
            className="flex min-w-0 items-center gap-3"
            href={`/author/${post.author.id}`}
          >
            <AuthorAvatar author={post.author} />
            <span className="truncate text-sm font-medium text-primary">
              {post.author.name}
            </span>
          </Link>
        ) : (
          <span />
        )}
      </div>

      <div className="mt-5">
        <TagList tags={post.tags} />
      </div>
    </article>
  );
}
