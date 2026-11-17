import { api } from '@/store/api';
import type {
  ContactInfoApiRow,
  ContactInfoItem,
  ContactInfoResponse,
  ContactSocialLink,
  ContactSocialLinkApiRow,
  ContactSocialLinksResponse,
} from '@/types/contact';

type GetContactInfoParams = {
  page?: number;
  limit?: number;
};

type GetContactSocialLinksParams = {
  page?: number;
  limit?: number;
  is_active?: boolean;
};

function normalizeLines(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function mapContactInfoItem(row: ContactInfoApiRow): ContactInfoItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    lines: normalizeLines(row.value),
  };
}

function mapContactSocialLink(row: ContactSocialLinkApiRow): ContactSocialLink {
  return {
    id: row.id,
    platform: row.platform,
    url: row.url,
  };
}

export const contactApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getContactInfo: builder.query<ContactInfoItem[], GetContactInfoParams | void>({
      query: (params) => {
        const p = params ?? {};

        return {
          url: '/contact-info',
          method: 'GET',
          params: {
            page: p.page ?? 1,
            limit: p.limit ?? 20,
          },
        };
      },
      transformResponse: (response: ContactInfoResponse) =>
        (response?.data ?? []).map(mapContactInfoItem),
    }),

    getContactSocialLinks: builder.query<
      ContactSocialLink[],
      GetContactSocialLinksParams | void
    >({
      query: (params) => {
        const p = params ?? {};

        return {
          url: '/contact-social-links',
          method: 'GET',
          params: {
            page: p.page ?? 1,
            limit: p.limit ?? 20,
            ...(p.is_active !== undefined ? { is_active: p.is_active } : {}),
          },
        };
      },
      transformResponse: (response: ContactSocialLinksResponse) =>
        (response?.data ?? []).map(mapContactSocialLink),
    }),
  }),
});

export const {
  useGetContactInfoQuery,
  useGetContactSocialLinksQuery,
} = contactApi;