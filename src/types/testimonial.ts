export type Testimonial = {
  id: string;
  name: string;
  role: string;
  imageUrl: string | null;
  quote: string;
  rating: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TestimonialsListResponse = {
  data: Testimonial[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
