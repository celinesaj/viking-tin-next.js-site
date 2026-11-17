'use client';

import { X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import FieldError from '@/app/dashboard/_components/FieldError';
import { useRemoveUserFromCouponWhitelistMutation } from '@/app/dashboard/redux/reducers/CouponsSlice/CouponsApiSlice';
import { useGetStorefrontUsersAdminQuery } from '@/features/users/storefrontUsersAdminApi';
import type { StorefrontUserAdmin } from '@/types/storefront-users-admin';

function extractServerMessage(error: unknown, fallbackMessage: string) {
  if (!error || typeof error !== 'object') return fallbackMessage;
  if ('data' in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'string' && data.trim()) return data;
    if (data && typeof data === 'object') {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) return message;
    }
  }
  return fallbackMessage;
}

const CLIENTS_PAGE_LIMIT = 500;

function formatClientLabel(row: StorefrontUserAdmin): string {
  const name = row.name?.trim() || '—';
  const email = row.email?.trim() || '—';
  return `${name} (${email})`;
}

function matchesClientSearch(row: StorefrontUserAdmin, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const name = (row.name ?? '').toLowerCase();
  const first = (row.firstName ?? '').toLowerCase();
  const last = (row.lastName ?? '').toLowerCase();
  const full = `${first} ${last}`.trim();
  const email = (row.email ?? '').toLowerCase();
  return (
    name.includes(q) ||
    first.includes(q) ||
    last.includes(q) ||
    full.includes(q) ||
    email.includes(q)
  );
}

type Target = { id: string; code: string };

type Props = {
  open: boolean;
  target: Target | null;
  onClose: () => void;
};

export default function CouponRemoveWhitelistUserDrawer({ open, target, onClose }: Props) {
  const [userId, setUserId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [removeUser, { isLoading }] = useRemoveUserFromCouponWhitelistMutation();
  const {
    data: clientsData,
    isLoading: isLoadingClients,
    isError: isClientsError,
  } = useGetStorefrontUsersAdminQuery(
    { page: 1, limit: CLIENTS_PAGE_LIMIT },
    { skip: !open },
  );

  const clients = clientsData?.data ?? [];
  const hasMoreClients =
    (clientsData?.pagination.totalPages ?? 1) > 1 ||
    (clientsData?.pagination.total ?? 0) > clients.length;

  const clientOptions = useMemo(
    () =>
      [...clients].sort((a, b) =>
        formatClientLabel(a).localeCompare(formatClientLabel(b), undefined, {
          sensitivity: 'base',
        }),
      ),
    [clients],
  );

  const filteredForSearch = useMemo(
    () => clientOptions.filter((row) => matchesClientSearch(row, clientSearch)),
    [clientOptions, clientSearch],
  );

  const listRows = useMemo(() => {
    if (!userId) return filteredForSearch;
    const selected = clientOptions.find((r) => r.id === userId);
    if (selected && !filteredForSearch.some((r) => r.id === userId)) {
      return [selected, ...filteredForSearch];
    }
    return filteredForSearch;
  }, [userId, clientOptions, filteredForSearch]);

  useEffect(() => {
    if (open) {
      setUserId('');
      setClientSearch('');
      setError(null);
    }
  }, [open, target?.id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target) return;
    const id = userId.trim();
    if (!id) {
      setError('Choose a client from the list.');
      return;
    }
    setError(null);
    try {
      await removeUser({
        couponId: target.id,
        userId: id,
      }).unwrap();
      const selected = clients.find((r) => r.id === id);
      toast.success(
        selected
          ? `${formatClientLabel(selected)} removed from whitelist for ${target.code}.`
          : `User removed from whitelist for ${target.code}.`,
      );
      onClose();
    } catch (err) {
      toast.error(extractServerMessage(err, 'Could not remove user from whitelist.'));
    }
  }

  if (!open || !target) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="h-full flex-1 bg-black/40"
      />
      <aside className="flex h-full max-h-screen min-h-0 w-full max-w-md flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
        <header className="shrink-0 flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-[#111111]">Remove from whitelist</h3>
            <p className="mt-1 text-xs text-[#6b7280]">
              DELETE /coupons/admin/{target.id}/users/:userId — coupon{' '}
              <span className="font-mono font-medium">{target.code}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f4f6f8] hover:text-[#111111]"
          >
            <X size={16} />
          </button>
        </header>
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <div className="block space-y-1.5">
              <span className="text-sm font-medium text-[#111111]">Client</span>
              <div className="space-y-2">
                <label className="block space-y-1" htmlFor="rm-wl-client-search">
                  <span className="text-xs text-[#6b7280]">Search by name or email</span>
                  <input
                    id="rm-wl-client-search"
                    type="search"
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setError(null);
                    }}
                    disabled={isLoadingClients}
                    placeholder="Type a name or email…"
                    autoComplete="off"
                    className="h-10 w-full rounded-lg border border-[#dbe1ea] bg-white px-3 text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] disabled:cursor-wait disabled:opacity-70"
                  />
                </label>
                <div
                  role="listbox"
                  aria-label="Clients"
                  className="max-h-52 overflow-y-auto rounded-lg border border-[#dbe1ea] bg-white"
                >
                  {isLoadingClients ? (
                    <p className="px-3 py-3 text-sm text-[#6b7280]">Loading clients…</p>
                  ) : listRows.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-[#6b7280]">
                      {clientSearch.trim()
                        ? 'No clients match that search.'
                        : 'No clients to show.'}
                    </p>
                  ) : (
                    listRows.map((row) => {
                      const selected = userId === row.id;
                      return (
                        <button
                          key={row.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => {
                            setError(null);
                            setUserId(row.id);
                          }}
                          className={`w-full border-b border-[#eef2f7] px-3 py-2.5 text-left text-sm last:border-b-0 ${
                            selected
                              ? 'bg-[#f3f4f6] font-medium text-[#111111]'
                              : 'text-[#374151] hover:bg-[#fafafa]'
                          }`}
                        >
                          {formatClientLabel(row)}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
              {isClientsError && (
                <p className="text-xs text-red-600">Could not load clients. Refresh and try again.</p>
              )}
              {!isLoadingClients && !isClientsError && clients.length === 0 && (
                <p className="text-xs text-[#6b7280]">No storefront users found.</p>
              )}
              {hasMoreClients && !isLoadingClients && (
                <p className="text-xs text-amber-700">
                  Showing the first {clients.length} clients. Use Customers if yours is not listed.
                </p>
              )}
              <FieldError message={error} />
            </div>
          </div>
          <div className="shrink-0 border-t border-[#eef2f7] bg-[#fafafa] px-5 py-4">
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || isLoadingClients || !userId.trim() || isClientsError}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {isLoading ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </form>
      </aside>
    </div>
  );
}
