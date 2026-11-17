export type FaqCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type FaqItem = {
  id: number;
  question: string;
  answer: string;
  categoryId: string;
  category: FaqCategory | null;
  displayOrder: number;
  isPublished: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type FaqPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type FaqResponse = {
  data: FaqItem[];
  pagination: FaqPagination;
};