import { headers } from "next/headers";
import type {
  AuthorPostsResponse,
  BlogCategory,
  BlogPost,
  CategoriesResponse,
  CategoryPostsResponse,
  PostsResponse,
} from "@/types/blog";

type FetchOptions = {
  revalidate?: number;
  noStore?: boolean;
};

async function getBaseUrl(): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${protocol}://${host}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

async function fetchJson<T>(
  path: string,
  { revalidate = 60, noStore = false }: FetchOptions = {},
): Promise<T> {
  const response = await fetch(`${await getBaseUrl()}${path}`, {
    ...(noStore ? { cache: "no-store" as const } : { next: { revalidate } }),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${path}`);
  }

  return (await response.json()) as T;
}

export async function getPosts(params: {
  page?: string;
  categorySlug?: string;
  authorId?: string;
} = {}): Promise<PostsResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set("page", params.page);
  }

  if (params.categorySlug) {
    searchParams.set("category_slug", params.categorySlug);
  }

  if (params.authorId) {
    searchParams.set("author_id", params.authorId);
  }

  const query = searchParams.toString();
  return fetchJson<PostsResponse>(`/api/v1/posts${query ? `?${query}` : ""}`);
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    return await fetchJson<BlogPost>(`/api/v1/posts/${slug}`);
  } catch {
    return null;
  }
}

export async function getCategories(): Promise<BlogCategory[]> {
  const response = await fetchJson<CategoriesResponse>("/api/v1/categories");
  return response.categories;
}

export async function getCategoryPosts(params: {
  slug: string;
  page?: string;
}): Promise<CategoryPostsResponse | null> {
  try {
    const searchParams = new URLSearchParams();

    if (params.page) {
      searchParams.set("page", params.page);
    }

    const query = searchParams.toString();
    return await fetchJson<CategoryPostsResponse>(
      `/api/v1/categories/${params.slug}/posts${query ? `?${query}` : ""}`,
    );
  } catch {
    return null;
  }
}

export async function getAuthorPosts(params: {
  id: string;
  page?: string;
}): Promise<AuthorPostsResponse | null> {
  try {
    const searchParams = new URLSearchParams();

    if (params.page) {
      searchParams.set("page", params.page);
    }

    const query = searchParams.toString();
    return await fetchJson<AuthorPostsResponse>(
      `/api/v1/authors/${params.id}${query ? `?${query}` : ""}`,
    );
  } catch {
    return null;
  }
}
