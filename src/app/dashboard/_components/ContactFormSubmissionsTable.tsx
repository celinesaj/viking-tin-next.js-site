'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import TableDotsLoader from '@/app/dashboard/_components/TableDotsLoader';
import { useGetContactFormAdminQuery } from '@/features/contact-form/contactFormApi';

function extractServerMessage(error: unknown, fallbackMessage: string) {
  if (!error || typeof error !== 'object') return fallbackMessage;

  if ('data' in error) {
    const data = (error as { data?: unknown }).data;

    if (typeof data === 'string' && data.trim()) return data;

    if (data && typeof data === 'object') {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) return message;
      if (Array.isArray(message)) {
        const list = message.filter((item): item is string => typeof item === 'string');
        if (list.length > 0) return list.join(', ');
      }

      const errorText = (data as { error?: unknown }).error;
      if (typeof errorText === 'string' && errorText.trim()) return errorText;
    }
  }

  if ('error' in error) {
    const errorText = (error as { error?: unknown }).error;
    if (typeof errorText === 'string' && errorText.trim()) return errorText;
  }

  return fallbackMessage;
}

function getVisiblePageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  const set = new Set<number>();
  set.add(1);
  set.add(total);
  for (let p = current - 1; p <= current + 1; p += 1) {
    if (p >= 1 && p <= total) set.add(p);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | 'ellipsis')[] = [];
  for (let index = 0; index < sorted.length; index += 1) {
    if (index > 0 && sorted[index] - sorted[index - 1] > 1) {
      out.push('ellipsis');
    }
    out.push(sorted[index]);
  }
  return out;
}

const PAGE_SIZE = 20;

function formatWhen(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function ContactFormSubmissionsTable() {
  const [page, setPage] = useState(1);

  const queryArgs = useMemo(() => ({ page, limit: PAGE_SIZE }), [page]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: loadError,
  } = useGetContactFormAdminQuery(queryArgs);

  const pagination = data?.pagination;
  const rows = data?.data ?? [];
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const total = pagination?.total ?? 0;
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (!pagination) return;
    if (pagination.totalPages >= 1 && page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [pagination, page]);

  const visiblePages = useMemo(
    () => getVisiblePageNumbers(safePage, totalPages),
    [safePage, totalPages],
  );

  const rangeLabel = useMemo(() => {
    if (!pagination || rows.length === 0) return { start: 0, end: 0 };
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = start + rows.length - 1;
    return { start, end };
  }, [pagination, rows.length]);

  const showLoader = isLoading || (isFetching && !data);

  return (
    <section className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5">
      <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-base font-semibold">Contact form submissions</h2>
          <p className="mt-1 text-xs text-[#9ca3af]">
            GET /contact-form/admin — newest first
          </p>
        </div>
      </div>

      {showLoader ? <TableDotsLoader /> : null}

      {isError ? (
        <p className="text-sm text-red-600">
          {extractServerMessage(loadError, 'Failed to load submissions.')}
        </p>
      ) : null}

      {!showLoader && !isError && total === 0 ? (
        <p className="text-sm text-[#6b7280]">No submissions yet.</p>
      ) : null}

      {!showLoader && !isError && total > 0 ? (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#e5e5e5] text-left text-xs uppercase tracking-wide text-[#9ca3af]">
                  <th className="px-3 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Email</th>
                  <th className="px-3 py-3 font-medium">Phone</th>
                  <th className="min-w-[140px] px-3 py-3 font-medium">Subject</th>
                  <th className="min-w-[200px] max-w-[320px] px-3 py-3 font-medium">Message</th>
                  <th className="whitespace-nowrap px-3 py-3 font-medium">Received</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[#f1f1f1] transition-colors hover:bg-[#f8fafc]"
                  >
                    <td className="px-3 py-4">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-[#111111]">
                          {row.name?.trim() || '—'}
                        </div>
                        <div className="truncate text-xs text-[#6b7280]">ID {row.id}</div>
                      </div>
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-4 text-[#111111]">
                      {row.email?.trim() ? (
                        <a
                          href={`mailto:${row.email.trim()}`}
                          className="text-[#111111] underline-offset-2 hover:underline"
                        >
                          {row.email.trim()}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-[#6b7280]">
                      {row.phone?.trim() || '—'}
                    </td>
                    <td className="max-w-[200px] px-3 py-4 text-[#374151]">
                      <span className="line-clamp-2" title={row.subject}>
                        {row.subject?.trim() || '—'}
                      </span>
                    </td>
                    <td className="max-w-[320px] px-3 py-4 text-[#6b7280]">
                      <span className="line-clamp-3 whitespace-pre-wrap" title={row.message}>
                        {row.message?.trim() || '—'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-[#6b7280]">
                      {formatWhen(row.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#6b7280]">
              Showing {rangeLabel.start}–{rangeLabel.end} of {total}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={14} />
                Prev
              </button>
              <div className="flex flex-wrap items-center gap-1">
                {visiblePages.map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`e-${idx}`} className="px-2 text-xs text-[#9ca3af]">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      disabled={isFetching}
                      onClick={() => setPage(item)}
                      className={`min-w-8 rounded-lg px-2 py-1 text-xs font-medium ${
                        item === safePage
                          ? 'bg-[#111111] text-white'
                          : 'border border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f8fafc]'
                      } disabled:opacity-50`}
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>
              <button
                type="button"
                disabled={safePage >= totalPages || isFetching}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
