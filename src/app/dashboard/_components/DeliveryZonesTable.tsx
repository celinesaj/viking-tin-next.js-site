'use client';

import { MoreHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import RowActionsFloatingMenu, {
  ROW_ACTIONS_PORTAL_SELECTOR,
} from '@/app/dashboard/_components/RowActionsFloatingMenu';
import TableDotsLoader from '@/app/dashboard/_components/TableDotsLoader';
import EditDeliveryZoneDrawer from '@/app/dashboard/_components/EditDeliveryZoneDrawer';
import {
  useDeleteDeliveryZoneMutation,
  useGetDeliveryZonesQuery,
  useUpdateDeliveryZoneMutation,
} from '@/features/delivery-zones/deliveryZonesApi';
import type { DeliveryZone } from '@/types/delivery-zones';

function extractServerMessage(error: unknown, fallbackMessage: string) {
  if (!error || typeof error !== 'object') return fallbackMessage;
  if ('data' in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'string' && data.trim()) return data;
    if (data && typeof data === 'object') {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) return message;
      if (Array.isArray(message)) {
        const joined = message.filter((item): item is string => typeof item === 'string').join(', ');
        if (joined) return joined;
      }
    }
  }
  return fallbackMessage;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatPrice(value: string): string {
  const num = Number(value);
  if (Number.isNaN(num)) return value || '—';
  return num.toFixed(2);
}

type DeliveryZoneActiveSwitchProps = {
  row: DeliveryZone;
  disabled: boolean;
  busy: boolean;
  onToggle: (row: DeliveryZone) => void;
};

function DeliveryZoneActiveSwitch({ row, disabled, busy, onToggle }: DeliveryZoneActiveSwitchProps) {
  const on = row.isActive;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-busy={busy}
      aria-label={on ? `Deactivate ${row.name}` : `Activate ${row.name}`}
      disabled={disabled || busy}
      onClick={() => onToggle(row)}
      className={`relative flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
        on ? 'bg-emerald-500' : 'bg-[#d1d5db]'
      } ${disabled || busy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
          on ? 'translate-x-5' : 'translate-x-0'
        }`}
        aria-hidden
      />
    </button>
  );
}

export default function DeliveryZonesTable() {
  const [actionsMenuId, setActionsMenuId] = useState<string | null>(null);
  const actionsBtnRef = useRef<HTMLButtonElement>(null);
  const [editDeliveryZone, setEditDeliveryZone] = useState<DeliveryZone | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [patchPending, setPatchPending] = useState<Record<string, boolean>>({});

  const { data, isLoading, isFetching, isError, error } = useGetDeliveryZonesQuery();
  const [updateDeliveryZone, { isLoading: isUpdating }] = useUpdateDeliveryZoneMutation();
  const [deleteDeliveryZone, { isLoading: isDeleting }] = useDeleteDeliveryZoneMutation();

  const rows = data ?? [];
  const showLoader = isLoading || (isFetching && !data);
  const rowActionBusy = isUpdating || isDeleting;
  const activeRowForMenu =
    actionsMenuId !== null ? rows.find((r) => r.id === actionsMenuId) ?? null : null;

  useEffect(() => {
    if (!actionsMenuId) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-delivery-zone-actions-root]')) return;
      if (target.closest(ROW_ACTIONS_PORTAL_SELECTOR)) return;
      setActionsMenuId(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setActionsMenuId(null);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [actionsMenuId]);

  function setRowPatchPending(id: string, pending: boolean) {
    setPatchPending((prev) => {
      if (pending) return { ...prev, [id]: true };
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function handleToggleActive(row: DeliveryZone) {
    const next = !row.isActive;
    setRowPatchPending(row.id, true);
    try {
      await updateDeliveryZone({
        id: row.id,
        name: row.name,
        description: row.description || undefined,
        price: Number(row.price),
        is_active: next,
      }).unwrap();
      toast.success(next ? `"${row.name}" is now active.` : `"${row.name}" is now inactive.`);
    } catch (err) {
      toast.error(extractServerMessage(err, 'Failed to update status.'));
    } finally {
      setRowPatchPending(row.id, false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDeliveryZone(deleteTarget.id).unwrap();
      toast.success('Delivery zone deleted permanently.');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(extractServerMessage(err, 'Failed to delete delivery zone.'));
    }
  }

  return (
    <>
      <section className="min-w-0 rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Delivery zones</h2>
          <p className="mt-1 text-xs text-[#9ca3af]">GET /delivery-zones</p>
        </div>

        {showLoader ? <TableDotsLoader /> : null}

        {isError ? (
          <p className="text-sm text-red-600">
            {extractServerMessage(error, 'Failed to load delivery zones.')}
          </p>
        ) : null}

        {!showLoader && !isError && rows.length === 0 ? (
          <p className="text-sm text-[#6b7280]">No delivery zones found.</p>
        ) : null}

        {!showLoader && !isError && rows.length > 0 ? (
          <div className="min-w-0">
            <table className="w-full max-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#e5e5e5] text-left text-xs uppercase tracking-wide text-[#9ca3af]">
                  <th className="px-2 py-3 font-medium lg:px-3">Name</th>
                  <th className="hidden px-2 py-3 font-medium md:table-cell lg:px-3">Description</th>
                  <th className="px-2 py-3 font-medium lg:px-3">Price</th>
                  <th className="px-2 py-3 font-medium lg:px-3">Active</th>
                  <th className="hidden px-2 py-3 font-medium lg:table-cell lg:px-3">Updated</th>
                  <th className="w-10 px-1 py-3 text-right font-medium sm:w-12 sm:px-2 lg:px-3">
                    {' '}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[#f1f1f1] transition-colors hover:bg-[#f8fafc]"
                  >
                    <td className="min-w-0 px-2 py-4 font-medium text-[#111111] lg:px-3">
                      <span className="truncate">{row.name}</span>
                    </td>
                    <td className="hidden min-w-0 px-2 py-4 text-[#6b7280] md:table-cell lg:px-3">
                      <span className="line-clamp-2">{row.description || '—'}</span>
                    </td>
                    <td className="px-2 py-4 text-[#111111] lg:px-3">{formatPrice(row.price)}</td>
                    <td className="px-2 py-4 lg:px-3">
                      <DeliveryZoneActiveSwitch
                        row={row}
                        busy={Boolean(patchPending[row.id])}
                        disabled={isDeleting}
                        onToggle={(r) => {
                          void handleToggleActive(r);
                        }}
                      />
                    </td>
                    <td className="hidden px-2 py-4 text-[#6b7280] lg:table-cell lg:px-3">
                      {formatDate(row.updatedAt)}
                    </td>
                    <td className="px-1 py-4 text-right sm:px-2 lg:px-3">
                      <div className="inline-block text-left" data-delivery-zone-actions-root>
                        <button
                          ref={actionsMenuId === row.id ? actionsBtnRef : undefined}
                          type="button"
                          aria-expanded={actionsMenuId === row.id}
                          aria-haspopup="menu"
                          aria-label={`Actions for ${row.name}`}
                          onClick={() =>
                            setActionsMenuId((current) => (current === row.id ? null : row.id))
                          }
                          disabled={rowActionBusy || Boolean(patchPending[row.id])}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#f8fafc] disabled:opacity-50"
                        >
                          <MoreHorizontal size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {activeRowForMenu ? (
          <RowActionsFloatingMenu open triggerRef={actionsBtnRef}>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setActionsMenuId(null);
                setEditDeliveryZone(activeRowForMenu);
              }}
              disabled={rowActionBusy || Boolean(patchPending[activeRowForMenu.id])}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#111111] hover:bg-[#f3f4f6]"
            >
              Edit
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setActionsMenuId(null);
                setDeleteTarget({ id: activeRowForMenu.id, name: activeRowForMenu.name });
              }}
              disabled={rowActionBusy || Boolean(patchPending[activeRowForMenu.id])}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </RowActionsFloatingMenu>
        ) : null}
      </section>

      <EditDeliveryZoneDrawer deliveryZone={editDeliveryZone} onClose={() => setEditDeliveryZone(null)} />

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#111111]">Delete delivery zone</h3>
            <p className="mt-2 text-sm text-[#6b7280]">
              Are you sure you need to delete{' '}
              <span className="font-semibold text-[#111111]">&quot;{deleteTarget.name}&quot;</span>?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="rounded-xl border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void confirmDelete();
                }}
                disabled={isDeleting}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-70"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
