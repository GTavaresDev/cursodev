import { PostListSkeleton, Skeleton } from "@/app/components/ui/Skeleton";

export default function Loading() {
  return (
    <section className="mx-auto max-w-listing px-4 py-12">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-4 h-10 w-56" />
      <div className="mt-8">
        <PostListSkeleton />
      </div>
    </section>
  );
}
