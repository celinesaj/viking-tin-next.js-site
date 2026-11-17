export type AdminAccountRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  created_at: string | null;
  last_login_at: string | null;
};

export type AdminAccountsListResponse = {
  data: AdminAccountRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
