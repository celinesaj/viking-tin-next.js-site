'use client';

import { X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useGrantAdminFreebieEligibilityMutation } from '@/features/freebie/freebiesAdminApi';
import type { StorefrontUserAdmin } from '@/types/storefront-users-admin';

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
    }
  }
  return fallbackMessage;
}

function displayLabel(user: StorefrontUserAdmin): string {
  const email = user.email?.trim();
  const name = user.name?.trim();
  if (email && name && name.toLowerCase() !== email.toLowerCase()) return `${name} (${email})`;
  return email || name || `User ${user.id}`;
}

type Props = {
  user: StorefrontUserAdmin | null;
  onClose: () => void;
};

export default function GrantFreebieEligibilityDrawer({ user, onClose }: Props) {
  const [reason, setReason] = useState('');
  const [grantEligibility, { isLoading }] = useGrantAdminFreebieEligibilityMutation();

  const open = user !== null;

  useEffect(() => {
    if (open) {
      setReason('');
    }
  }, [open, user?.id]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const uid = user.id.trim();
    if (!uid) return;
    try {
      await grantEligibility({
        user_id: uid,
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      }).unwrap();
      toast.success('Eligibility granted.');
      onClose();
    } catch (err) {
      toast.error(extractServerMessage(err, 'Could not grant eligibility.'));
    }
  }

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-10060 flex">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="h-full flex-1 bg-black/40"
      />
      <aside className="flex h-full max-h-screen min-h-0 w-full max-w-md flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-[#eef2f7] px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-[#111111]">Grant freebie eligibility</h3>
            <p className="mt-1 text-xs text-[#6b7280]">
              POST <code className="rounded bg-[#f3f4f6] px-1 py-0.5 font-mono text-[11px]">/freebies/admin/eligibility</code>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f4f6f8] hover:text-[#111111] disabled:opacity-50"
          >
            <X size={18} aria-hidden />
          </button>
        </header>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">Customer</span>
              <p className="mt-1.5 text-sm font-medium text-[#111827]">{displayLabel(user)}</p>
              <p className="mt-0.5 font-mono text-xs text-[#9ca3af]">ID {user.id}</p>
            </div>
            <div>
              <label htmlFor="grant-freebie-drawer-reason" className="mb-1.5 block text-xs font-medium text-[#374151]">
                Reason <span className="font-normal text-[#9ca3af]">(optional)</span>
              </label>
              <textarea
                id="grant-freebie-drawer-reason"
                rows={4}
                value={reason}
                onChange={(ev) => setReason(ev.target.value)}
                disabled={isLoading}
                placeholder="Internal note on why this account qualifies"
                className="w-full resize-y rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#111827] outline-none ring-[#111827]/10 focus:border-[#111827]/25 focus:ring-2 min-h-[100px] disabled:opacity-60"
              />
            </div>
          </div>
          <div className="shrink-0 border-t border-[#eef2f7] bg-[#fafafa] px-5 py-4">
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-medium text-[#374151] hover:bg-[#f8fafc] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1f2937] disabled:opacity-60"
              >
                {isLoading ? 'Saving…' : 'Grant eligibility'}
              </button>
            </div>
          </div>
        </form>
      </aside>
    </div>
  );
}
