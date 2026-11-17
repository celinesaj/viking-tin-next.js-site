export type ContactHero = {
  title: string;
  description: string;
  backgroundImage: string;
  collageImage: string;
};

export type ContactInfoType = string;
export type ContactSocialPlatform = string;

export type ContactInfoItem = {
  id: string;
  type: ContactInfoType;
  title: string;
  lines: string[];
};

export type ContactSocialLink = {
  id: string;
  platform: ContactSocialPlatform;
  url: string;
};

export type ContactMap = {
  embedUrl: string;
  pinLabel?: string;
};

export type ContactFormData = {
  title: string;
  backgroundImage: string;
};

export type ContactPageData = {
  hero: ContactHero;
  breadcrumbLabel: string;
  infoItems: ContactInfoItem[];
  socialLinks: ContactSocialLink[];
  map: ContactMap;
  form: ContactFormData;
};

export type ContactInfoApiRow = {
  id: string;
  type: string;
  title: string;
  value: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ContactSocialLinkApiRow = {
  id: string;
  platform: string;
  url: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ContactInfoResponse = {
  data: ContactInfoApiRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ContactSocialLinksResponse = {
  data: ContactSocialLinkApiRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};