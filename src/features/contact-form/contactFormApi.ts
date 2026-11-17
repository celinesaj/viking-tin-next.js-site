import { api } from '@/store/api';
import type {
    ContactFormAdminListResponse,
    ContactFormRequest,
    ContactFormResponse,
    ContactFormSubmissionAdmin,
} from '@/types/contact-form';

export type GetContactFormAdminParams = {
    page?: number;
    limit?: number;
};

function mapContactFormSubmissionFromApi(raw: unknown): ContactFormSubmissionAdmin {
    const r =
        raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    return {
        id: r.id != null ? String(r.id) : '',
        name: typeof r.name === 'string' ? r.name : String(r.name ?? ''),
        email: typeof r.email === 'string' ? r.email : String(r.email ?? ''),
        message: typeof r.message === 'string' ? r.message : String(r.message ?? ''),
        subject: typeof r.subject === 'string' ? r.subject : String(r.subject ?? ''),
        phone: typeof r.phone === 'string' ? r.phone : String(r.phone ?? ''),
        createdAt:
            r.created_at != null
                ? String(r.created_at)
                : r.createdAt != null
                  ? String(r.createdAt)
                  : null,
    };
}

function normalizeAdminListResponse(raw: unknown): ContactFormAdminListResponse {
    if (!raw || typeof raw !== 'object') {
        return {
            data: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
        };
    }
    const o = raw as Record<string, unknown>;
    const dataArr = Array.isArray(o.data) ? o.data : [];
    const pag = o.pagination;
    if (pag && typeof pag === 'object') {
        const p = pag as Record<string, unknown>;
        const totalPages = Math.max(
            1,
            Number(p.totalPages ?? p.total_pages) || 1,
        );
        return {
            data: dataArr.map(mapContactFormSubmissionFromApi),
            pagination: {
                page: Number(p.page) || 1,
                limit: Number(p.limit) || 20,
                total: Number(p.total) || 0,
                totalPages,
            },
        };
    }
    return {
        data: dataArr.map(mapContactFormSubmissionFromApi),
        pagination: {
            page: 1,
            limit: dataArr.length || 20,
            total: dataArr.length,
            totalPages: 1,
        },
    };
}

export const contactFormApi = api.injectEndpoints({
    endpoints: (builder) => ({
        submitContactForm: builder.mutation<ContactFormResponse, ContactFormRequest>({
            query: (body) => ({
                url: '/contact-form',
                method: 'POST',
                body,
            }),
        }),
        getContactFormAdmin: builder.query<
            ContactFormAdminListResponse,
            GetContactFormAdminParams | void
        >({
            query: (params) => {
                const p = params ?? {};
                return {
                    url: '/contact-form/admin',
                    method: 'GET',
                    params: {
                        page: p.page ?? 1,
                        limit: p.limit ?? 20,
                    },
                };
            },
            transformResponse: (raw: unknown) => normalizeAdminListResponse(raw),
            providesTags: (result) =>
                result?.data?.length
                    ? [
                          ...result.data.map((row) => ({
                              type: 'ContactFormSubmission' as const,
                              id: row.id,
                          })),
                          { type: 'ContactFormSubmission' as const, id: 'LIST' },
                      ]
                    : [{ type: 'ContactFormSubmission' as const, id: 'LIST' }],
        }),
    }),
    overrideExisting: true,
});

export const { useSubmitContactFormMutation, useGetContactFormAdminQuery } =
    contactFormApi;