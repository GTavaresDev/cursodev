import type { BlogTag } from "@/types/blog";

type TagListProps = {
  tags: BlogTag[];
};

export function TagList({ tags }: TagListProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li
          className="rounded-full bg-muted/10 px-3 py-1 text-xs text-muted"
          key={tag.id}
        >
          #{tag.name}
        </li>
      ))}
    </ul>
  );
}
