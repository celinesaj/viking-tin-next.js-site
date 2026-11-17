export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BlogPost = {
  id: string;
  categoryId: string;
  category: BlogCategory | null;
  title: string;
  slug: string;
  featuredImage: string | null;
  featuredImageAlt?: string | null;
  content: string | null;
  author: string | null;
  publishedAt: string | null;
  isPublished: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BlogPostsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type BlogPostsListResponse = {
  data: BlogPost[];
  pagination: BlogPostsPagination;
};
