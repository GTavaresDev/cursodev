import Link from "next/link";
import type { BlogCategory } from "@/types/blog";

type CategoryBadgeProps = {
  category: BlogCategory | null;
};

export function CategoryBadge({ category }: CategoryBadgeProps) {
  if (!category) {
    return null;
  }

  return (
    <Link
      className="inline-flex rounded-full border border-secondary/25 px-3 py-1 text-xs font-semibold uppercase tracking-normal text-secondary transition hover:bg-secondary/10"
      href={`/categories/${category.slug}`}
    >
      {category.name}
    </Link>
  );
}
