export type BlogAuthor = {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
  posts_count?: number;
};

export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  posts_count?: number;
};

export type BlogTag = {
  id: string;
  name: string;
  slug: string;
};

export type BlogPostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author: BlogAuthor | null;
  category: BlogCategory | null;
  tags: BlogTag[];
};

export type BlogPost = BlogPostSummary & {
  content: string;
};

export type Pagination = {
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
};

export type PostsResponse = {
  posts: BlogPostSummary[];
  pagination: Pagination;
};

export type CategoriesResponse = {
  categories: BlogCategory[];
};

export type CategoryPostsResponse = PostsResponse & {
  category: BlogCategory;
};

export type AuthorPostsResponse = PostsResponse & {
  author: BlogAuthor;
};
