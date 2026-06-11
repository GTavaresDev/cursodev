import type { BlogPost } from "@/types/blog";
import { formatDate } from "@/app/lib/utils";
import { AuthorAvatar } from "./AuthorAvatar";
import { CategoryBadge } from "./CategoryBadge";
import { TagList } from "./TagList";

type PostContentProps = {
  post: BlogPost;
};

export function PostContent({ post }: PostContentProps) {
  const paragraphs = post.content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <article className="mx-auto max-w-reading px-4 py-12">
      <div className="mb-6">
        <CategoryBadge category={post.category} />
      </div>

      <h1 className="text-4xl font-bold leading-tight text-primary">
        {post.title}
      </h1>

      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted">
        {post.author ? (
          <span className="flex items-center gap-3">
            <AuthorAvatar author={post.author} />
            <span>{post.author.name}</span>
          </span>
        ) : null}
        <time dateTime={post.published_at ?? ""}>
          {formatDate(post.published_at)}
        </time>
      </div>

      {post.cover_image_url ? (
        <img
          alt=""
          className="mt-8 aspect-[16/9] w-full rounded-lg object-cover"
          src={post.cover_image_url}
        />
      ) : null}

      <div className="prose mt-10">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-10 border-t border-[rgb(var(--color-border))] pt-6">
        <TagList tags={post.tags} />
      </div>
    </article>
  );
}
