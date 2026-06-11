type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`skeleton rounded-md ${className}`} />;
}

export function PostListSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          className="rounded-lg border border-[rgb(var(--color-border))] bg-surface p-6"
          key={index}
        >
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-6 h-8 w-4/5" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <Skeleton className="mt-6 h-10 w-40" />
        </div>
      ))}
    </div>
  );
}
