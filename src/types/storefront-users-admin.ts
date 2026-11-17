export type StorefrontUserAdmin = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  phoneVerifiedAt: string | null;
  ageVerifiedAt: string | null;
  address: string;
  avatarUrl: string | null;
  authProvider: string;
  googleSub: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type StorefrontUsersAdminResponse = {
  data: StorefrontUserAdmin[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
