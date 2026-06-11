import type { BlogAuthor } from "@/types/blog";
import { getInitials } from "@/app/lib/utils";

type AuthorAvatarProps = {
  author: BlogAuthor | null;
};

export function AuthorAvatar({ author }: AuthorAvatarProps) {
  if (!author) {
    return null;
  }

  if (author.avatar_url) {
    return (
      <img
        alt=""
        className="h-10 w-10 rounded-full object-cover"
        src={author.avatar_url}
      />
    );
  }

  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/15 text-sm font-semibold text-secondary">
      {getInitials(author.name)}
    </span>
  );
}
