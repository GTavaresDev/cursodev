import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPost } from "@/app/lib/api";
import { PostContent } from "@/app/components/blog/PostContent";

type PostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: "Post nao encontrado",
    };
  }

  return {
    title: post.title,
    description: post.excerpt ?? post.title,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? post.title,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
      type: "article",
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return <PostContent post={post} />;
}
