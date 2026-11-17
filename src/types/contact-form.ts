export type ContactFormRequest = {
    name: string;
    email: string;
    subject: string;
    message: string;
    phone: string;
  };
  
  export type ContactFormResponse = {
    message: string;
  };
  
  export type ContactFormValues = {
    fullName: string;
    email: string;
    subject: string;
    message: string;
    phone: string;
  };
  
  export type ContactFormErrors = Partial<Record<keyof ContactFormValues, string>>;

export type ContactFormSubmissionAdmin = {
  id: string;
  name: string;
  email: string;
  message: string;
  subject: string;
  phone: string;
  createdAt: string | null;
};

export type ContactFormAdminPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ContactFormAdminListResponse = {
  data: ContactFormSubmissionAdmin[];
  pagination: ContactFormAdminPagination;
};