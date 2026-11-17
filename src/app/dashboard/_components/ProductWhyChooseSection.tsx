'use client';

import { AlertTriangle, Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import ProductFormSwitch from '@/app/dashboard/_components/ProductFormSwitch';
import {
  useAddProductWhyChooseMutation,
  useDeleteProductWhyChooseMutation,
  useGetProductWhyChooseQuery,
  useUpdateProductWhyChooseMutation,
} from '@/features/products/productsApi';
import type { ProductWhyChooseRow } from '@/types/products';

const REASON_MAX = 2000;
const ADD_REASON_MAX = 320;

const addBlockClass =
  'rounded-2xl border-2 border-dashed border-[#c5ced9] bg-linear-to-b from-white to-[#f8fafc] p-4 ring-1 ring-[#e8ecf2]/60';

const iconCircleBase =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50';

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

type RowLineProps = {
  row: ProductWhyChooseRow;
  disabled: boolean;
  onRequestEdit: (row: ProductWhyChooseRow) => void;
  onRequestDelete: (row: ProductWhyChooseRow) => void;
  index: number;
  pencilBusy: boolean;
  trashBusy: boolean;
  isEditing: boolean;
};

function WhyChooseRowLine({
  row,
  disabled,
  onRequestEdit,
  onRequestDelete,
  index,
  pencilBusy,
  trashBusy,
  isEditing,
}: RowLineProps) {
  return (
    <div
      className={`flex items-center gap-2 ${isEditing ? 'rounded-xl ring-2 ring-[#111111]/15' : ''}`}
    >
      <span
        className="flex h-8 min-w-8 items-center justify-center rounded-full bg-[#f0f4f8] text-[11px] font-bold text-[#64748b]"
        aria-hidden
      >
        {index + 1}
      </span>
      <input
        type="text"
        readOnly
        value={row.reason}
        title={row.reason}
        className="h-9 min-w-0 flex-1 cursor-default rounded-full border border-[#e8ecf2] bg-[#f8fafc] px-3 text-sm text-[#111111] truncate"
        tabIndex={-1}
        aria-label={`Why choose line ${index + 1}`}
      />
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => onRequestEdit(row)}
          disabled={disabled}
          className={`${iconCircleBase} border-[#e2e8f0] bg-white text-[#0f172a] hover:border-[#cbd5e1] hover:bg-[#f8fafc] focus-visible:ring-[#94a3b8] ${isEditing ? 'ring-2 ring-[#111111]/20' : ''}`}
          aria-label="Edit this line"
        >
          {pencilBusy ? (
            <span className="text-[10px] font-medium">…</span>
          ) : (
            <Pencil size={15} strokeWidth={2.2} aria-hidden />
          )}
        </button>
        <button
          type="button"
          onClick={() => onRequestDelete(row)}
          disabled={disabled}
          className={`${iconCircleBase} border-red-200/90 bg-white text-red-600 hover:border-red-300 hover:bg-red-50 focus-visible:ring-red-400/80`}
          aria-label="Delete this line"
        >
          {trashBusy ? (
            <span className="text-[10px] font-medium">…</span>
          ) : (
            <Trash2 size={15} strokeWidth={2.2} aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}

function parseSortOrder(s: string): number {
  const n = Number(s.trim());
  return Number.isFinite(n) ? n : 0;
}

type EditInlineProps = {
  row: ProductWhyChooseRow;
  productId: string;
  onDone: () => void;
};

function EditWhyChooseInline({ row, productId, onDone }: EditInlineProps) {
  const [updateWhyChoose, { isLoading: isSaving }] = useUpdateProductWhyChooseMutation();
  const [reason, setReason] = useState(row.reason);
  const [sortOrder, setSortOrder] = useState(String(row.sortOrder));
  const [isActive, setIsActive] = useState(row.isActive);

  useEffect(() => {
    setReason(row.reason);
    setSortOrder(String(row.sortOrder));
    setIsActive(row.isActive);
  }, [row.id, row.reason, row.sortOrder, row.isActive]);

  async function handleSave() {
    const trimmed = reason.trim();
    if (trimmed === '') {
      toast.error('Reason cannot be empty.');
      return;
    }
    try {
      await updateWhyChoose({
        productId,
        whyChooseId: row.id,
        body: {
          reason: trimmed,
          sort_order: parseSortOrder(sortOrder),
          is_active: isActive,
        },
      }).unwrap();
      toast.success('Why-choose line updated.');
      onDone();
    } catch (error) {
      console.error('updateProductWhyChoose', error);
      toast.error(extractServerMessage(error, 'Could not update this line.'));
    }
  }

  return (
    <div className={addBlockClass} role="region" aria-label="Edit why-choose line">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111111] text-white">
            <Pencil size={15} strokeWidth={2.2} aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#111111]">Edit this line</p>
            <p className="text-[11px] text-[#64748b]">Same layout as add — change text, sort, and active.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDone}
          disabled={isSaving}
          className="shrink-0 rounded-lg p-1.5 text-[#6b7280] hover:bg-[#f1f5f9] hover:text-[#111111] disabled:opacity-50"
          aria-label="Close editor"
        >
          <X size={16} />
        </button>
      </div>
      <div className="space-y-3">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[#374151]">Reason</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, REASON_MAX))}
            rows={3}
            disabled={isSaving}
            className="w-full rounded-xl border border-[#dbe1ea] bg-white px-2.5 py-2 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111]/12 disabled:opacity-60"
          />
          <span className="text-[10px] text-[#9ca3af]">
            {reason.trim().length}/{REASON_MAX}
          </span>
        </label>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block w-24 space-y-1">
            <span className="text-xs font-medium text-[#374151]">Sort</span>
            <input
              type="text"
              inputMode="numeric"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              disabled={isSaving}
              className="h-9 w-full rounded-xl border border-[#dbe1ea] bg-white px-2.5 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111]/12 disabled:opacity-60"
            />
          </label>
          <ProductFormSwitch
            label="Active"
            variant="emerald"
            checked={isActive}
            disabled={isSaving}
            onCheckedChange={setIsActive}
          />
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-[#eef2f7] pt-3">
          <button
            type="button"
            onClick={onDone}
            disabled={isSaving}
            className="rounded-xl border border-[#d1d5db] bg-white px-3 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#f8fafc] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex min-w-24 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.1)] bg-linear-to-r from-[#050506] via-[#141418] to-[#2a2a31] px-3.5 py-1.5 text-xs font-semibold text-[#f8f8fa] disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

type DeleteModalProps = {
  row: ProductWhyChooseRow | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
};

function DeleteWhyChooseModal({ row, onClose, onConfirm, isDeleting }: DeleteModalProps) {
  if (typeof document === 'undefined' || !row) return null;

  const preview =
    row.reason.trim().length > 120
      ? `${row.reason.trim().slice(0, 120)}…`
      : row.reason.trim() || '(empty)';

  return createPortal(
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        disabled={isDeleting}
        className="absolute inset-0 cursor-default bg-black/50"
      />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-[#e8ecf2] bg-white p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="why-choose-delete-title"
        aria-describedby="why-choose-delete-desc"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle size={20} strokeWidth={2} aria-hidden />
            </span>
            <div>
              <h3
                id="why-choose-delete-title"
                className="text-base font-semibold text-[#111111]"
              >
                Remove this line?
              </h3>
              <p id="why-choose-delete-desc" className="mt-1 text-sm text-[#6b7280]">
                This will remove this “why choose” bullet from the product. You can add it again
                later.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="shrink-0 rounded-lg p-1.5 text-[#6b7280] hover:bg-[#f4f6f8] disabled:opacity-50"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-xs font-medium text-[#64748b]">Preview</p>
        <p className="mt-1 rounded-xl border border-[#eef2f7] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#334155]">
          {preview}
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border border-[#d1d5db] bg-white px-3.5 py-2 text-sm font-medium text-[#374151] hover:bg-[#f8fafc] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex min-w-24 items-center justify-center rounded-xl border border-red-600 bg-red-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isDeleting ? 'Removing…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

type Props = { productId: string };

export default function ProductWhyChooseSection({ productId }: Props) {
  const { data: rows, isLoading, isError, error, isFetching } = useGetProductWhyChooseQuery(
    productId,
  );
  const [addWhyChoose, { isLoading: isAdding }] = useAddProductWhyChooseMutation();
  const [deleteWhyChoose, { isLoading: isDeleting }] = useDeleteProductWhyChooseMutation();
  const [, { isLoading: isUpdatingLine }] = useUpdateProductWhyChooseMutation();

  const [addReason, setAddReason] = useState('');
  const [addSort, setAddSort] = useState('0');
  const [addActive, setAddActive] = useState(true);
  const [rowBusy, setRowBusy] = useState<string | 'add' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductWhyChooseRow | null>(null);
  const [editTarget, setEditTarget] = useState<ProductWhyChooseRow | null>(null);

  const addBusy = isAdding || rowBusy === 'add';
  const list = Array.isArray(rows) ? rows : [];
  const sorted = [...list].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });

  function openEdit(row: ProductWhyChooseRow) {
    setDeleteTarget(null);
    setRowBusy(null);
    setEditTarget((prev) => (prev?.id === row.id ? null : row));
  }

  function openDelete(row: ProductWhyChooseRow) {
    setEditTarget(null);
    setDeleteTarget(row);
  }

  async function handleAdd() {
    setRowBusy('add');
    const trimmed = addReason.trim();
    if (trimmed === '') {
      toast.error('Enter a reason to add a line.');
      setRowBusy(null);
      return;
    }
    try {
      await addWhyChoose({
        productId,
        body: {
          reason: trimmed,
          sort_order: parseSortOrder(addSort),
          is_active: addActive,
        },
      }).unwrap();
      setAddReason('');
      setAddSort('0');
      setAddActive(true);
      toast.success('Why-choose line added.');
    } catch (err) {
      console.error('addProductWhyChoose', err);
      toast.error(extractServerMessage(err, 'Could not add this line.'));
    } finally {
      setRowBusy(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setRowBusy(deleteTarget.id);
    try {
      await deleteWhyChoose({
        productId,
        whyChooseId: deleteTarget.id,
      }).unwrap();
      toast.success('Why-choose line removed.');
      setDeleteTarget(null);
    } catch (error) {
      console.error('deleteProductWhyChoose', error);
      toast.error(extractServerMessage(error, 'Could not delete this line.'));
    } finally {
      setRowBusy(null);
    }
  }

  const listDisabled = rowBusy !== null || isUpdatingLine;
  const addSectionDisabled = rowBusy !== null || isUpdatingLine || editTarget !== null;

  return (
    <div className="space-y-4 border-t border-[#eef2f7] pt-4">
      <div className="flex gap-3 rounded-2xl border border-[#e8ecf2] bg-linear-to-br from-[#f8fafc] to-white p-3.5 shadow-sm">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-[#e8ecf2]">
          <Sparkles size={18} className="text-amber-500" aria-hidden />
        </span>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-[#111111]">Why choose</h4>
          <p className="mt-0.5 text-xs leading-relaxed text-[#64748b]">
            Shown on the product page. Lower sort numbers appear first.
            {isFetching && !isLoading ? (
              <span className="ml-1.5 text-[#9ca3af]">· Refreshing…</span>
            ) : null}
          </p>
        </div>
      </div>

      {isError ? (
        <p className="text-sm text-red-600">
          {extractServerMessage(error, 'Could not load “why choose” lines.')}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-xs text-[#6b7280]">Loading “why choose”…</p>
      ) : (
        <ul className="space-y-2" aria-label="Why choose lines">
          {sorted.map((row, index) => (
            <li key={row.id} className="space-y-2">
              <WhyChooseRowLine
                row={row}
                index={index}
                isEditing={editTarget?.id === row.id}
                disabled={listDisabled}
                pencilBusy={Boolean(
                  isUpdatingLine && editTarget?.id === row.id,
                )}
                trashBusy={Boolean(isDeleting && deleteTarget?.id === row.id)}
                onRequestEdit={openEdit}
                onRequestDelete={openDelete}
              />
              {editTarget?.id === row.id ? (
                <EditWhyChooseInline
                  row={row}
                  productId={productId}
                  onDone={() => setEditTarget(null)}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <div className={addBlockClass}>
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111111] text-white">
            <Plus size={16} strokeWidth={2.5} aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#111111]">Add a new line</p>
            <p className="text-[11px] text-[#64748b]">This block stays last so you can add in one step.</p>
          </div>
        </div>
        <div className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#374151]">Reason</span>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={addReason}
                onChange={(e) => setAddReason(e.target.value.slice(0, ADD_REASON_MAX))}
                placeholder="e.g. Premium Scandinavian quality"
                autoComplete="off"
                disabled={addSectionDisabled}
                className="h-9 min-w-0 flex-1 rounded-xl border border-[#dbe1ea] bg-white px-2.5 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111111]/12 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={addSectionDisabled || addBusy}
                className={`${iconCircleBase} border-[#111111] bg-[#111111] text-white hover:bg-[#2a2a31] focus-visible:ring-[#111111]`}
                aria-label="Add line"
                title="Add line"
              >
                {addBusy ? (
                  <span className="text-[10px]">…</span>
                ) : (
                  <Plus size={15} strokeWidth={2.5} aria-hidden />
                )}
              </button>
            </div>
            <span className="text-[10px] text-[#9ca3af]">
              {addReason.trim().length}/{ADD_REASON_MAX} · single line
            </span>
          </label>
          <div className="flex flex-wrap items-end gap-3">
            <label className="block w-24 space-y-1">
              <span className="text-xs font-medium text-[#374151]">Sort</span>
              <input
                type="text"
                inputMode="numeric"
                value={addSort}
                onChange={(e) => setAddSort(e.target.value)}
                disabled={addSectionDisabled}
                className="h-9 w-full rounded-xl border border-[#dbe1ea] bg-white px-2.5 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111]/12 disabled:opacity-60"
              />
            </label>
            <ProductFormSwitch
              label="Active"
              variant="emerald"
              checked={addActive}
              disabled={addSectionDisabled}
              onCheckedChange={setAddActive}
            />
          </div>
        </div>
      </div>

      <DeleteWhyChooseModal
        row={deleteTarget}
        isDeleting={isDeleting}
        onClose={() => {
          if (isDeleting) return;
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
