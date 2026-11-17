'use client';

import { Plus, Trash2, X } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  useCreateRelatedItemMutation,
  useDeleteRelatedItemMutation,
  useGetRelatedItemSourcesQuery,
  useGetRelatedItemsForSourceQuery,
  useUpdateRelatedItemSortMutation,
} from '@/app/dashboard/redux/reducers/RelatedItemsSlice/RelatedItemsApiSlice';
import DashboardSelect, { type DashboardSelectOption } from '@/app/dashboard/_components/DashboardSelect';
import TableDotsLoader from '@/app/dashboard/_components/TableDotsLoader';
import { API_BASE_URL } from '@/constants/api';
import { useGetBundlesQuery } from '@/features/bundles/bundlesApi';
import { useGetProductsQuery } from '@/features/products/productsApi';
import { useGetSpecialOffersQuery } from '@/features/specialOffers/specialOffersApi';
import type { Bundle } from '@/types/bundles';
import type { Product } from '@/types/products';
import type { SpecialOffer } from '@/types/specialOffers';
import type { RelatedItemLink, RelatedResourceType } from '@/types/relatedItems';

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

const PICKER_LIMIT = 500;

const RESOURCE_TYPE_OPTIONS: DashboardSelectOption[] = [
  { value: '', label: 'Select resource type…' },
  { value: 'product', label: 'Product' },
  { value: 'bundle', label: 'Bundle' },
  { value: 'special_offer', label: 'Special offer' },
];

function resourceTypeLabel(t: RelatedResourceType): string {
  switch (t) {
    case 'product':
      return 'Product';
    case 'bundle':
      return 'Bundle';
    case 'special_offer':
      return 'Special offer';
    default:
      return t;
  }
}

function relatedEntityName(related: unknown | null): string | null {
  if (!related || typeof related !== 'object') return null;
  const name = (related as { name?: unknown }).name;
  return typeof name === 'string' && name.trim() ? name : null;
}

function resolveRelatedImageSrc(src: string | null | undefined): string | null {
  if (src == null) return null;
  const s = String(src).trim();
  if (s === '' || s.toUpperCase() === 'NULL') return null;
  if (/^https?:\/\//i.test(s)) return s;
  const base = API_BASE_URL.replace(/\/$/, '');
  return `${base}${s.startsWith('/') ? s : `/${s}`}`;
}

/** First product image by sort order (prefers `image` media). Bundle / special: main image. */
function relatedEntityImageUrl(
  related: unknown | null,
  relatedType: RelatedResourceType,
): string | null {
  if (!related || typeof related !== 'object') return null;
  const r = related as Record<string, unknown>;

  if (relatedType === 'product') {
    const media = r.media;
    if (!Array.isArray(media) || media.length === 0) return null;
    const rows: { kind: string; url: string; sort: number }[] = [];
    for (const item of media) {
      if (!item || typeof item !== 'object') continue;
      const m = item as Record<string, unknown>;
      const kind = String(m.mediaType ?? m.media_type ?? 'image').toLowerCase();
      const urlRaw = m.url;
      const url = typeof urlRaw === 'string' ? urlRaw : '';
      const sort = Number(m.sortOrder ?? m.sort_order ?? 0);
      rows.push({ kind, url, sort: Number.isFinite(sort) ? sort : 0 });
    }
    const images = rows.filter((x) => x.kind === 'image');
    const list = images.length > 0 ? images : rows;
    list.sort((a, b) => a.sort - b.sort);
    const first = list.find((x) => x.url.trim() !== '');
    return first ? resolveRelatedImageSrc(first.url) : null;
  }

  const main = r.imageUrl ?? r.image_url;
  if (typeof main === 'string' && main.trim()) return resolveRelatedImageSrc(main);
  return null;
}

type SelectedSource = {
  sourceType: RelatedResourceType;
  sourceId: string;
  name: string | null;
};

function useResourceIdOptions(
  resourceType: RelatedResourceType | '',
  products: ReturnType<typeof useGetProductsQuery>['data'],
  bundles: ReturnType<typeof useGetBundlesQuery>['data'],
  offers: ReturnType<typeof useGetSpecialOffersQuery>['data'],
): DashboardSelectOption[] {
  return useMemo(() => {
    const head: DashboardSelectOption[] = [{ value: '', label: 'Select item…' }];
    if (!resourceType) return head;
    if (resourceType === 'product') {
      const rows = products?.data ?? [];
      return [
        ...head,
        ...rows.map((p: Product) => ({
          value: p.id,
          label: `${p.name} (#${p.id})`,
        })),
      ];
    }
    if (resourceType === 'bundle') {
      const rows = bundles?.data ?? [];
      return [
        ...head,
        ...rows.map((b: Bundle) => ({
          value: b.id,
          label: `${b.name} (#${b.id})`,
        })),
      ];
    }
    const rows = offers?.data ?? [];
    return [
      ...head,
      ...rows.map((o: SpecialOffer) => ({
        value: o.id,
        label: `${o.name} (#${o.id})`,
      })),
    ];
  }, [resourceType, products, bundles, offers]);
}

export default function RelatedItemsTable() {
  const [selectedSource, setSelectedSource] = useState<SelectedSource | null>(null);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    label: string;
    sourceType: RelatedResourceType;
    sourceId: string;
  } | null>(null);

  const [manageRelatedType, setManageRelatedType] = useState<RelatedResourceType | ''>('');
  const [manageRelatedId, setManageRelatedId] = useState('');
  const [manageSortOrder, setManageSortOrder] = useState('');

  const [createSourceType, setCreateSourceType] = useState<RelatedResourceType | ''>('');
  const [createSourceId, setCreateSourceId] = useState('');
  const [createRelatedType, setCreateRelatedType] = useState<RelatedResourceType | ''>('');
  const [createRelatedId, setCreateRelatedId] = useState('');
  const [createSortOrder, setCreateSortOrder] = useState('');

  const [sortEdit, setSortEdit] = useState<{ id: string; value: string } | null>(null);

  const catalogsOpen = Boolean(selectedSource) || createDrawerOpen;

  const { data: productsData, isFetching: productsLoading } = useGetProductsQuery(
    { page: 1, limit: PICKER_LIMIT },
    { skip: !catalogsOpen },
  );
  const { data: bundlesData, isFetching: bundlesLoading } = useGetBundlesQuery(
    { page: 1, limit: PICKER_LIMIT },
    { skip: !catalogsOpen },
  );
  const { data: offersData, isFetching: offersLoading } = useGetSpecialOffersQuery(
    { page: 1, limit: PICKER_LIMIT },
    { skip: !catalogsOpen },
  );

  const manageIdOptions = useResourceIdOptions(
    manageRelatedType,
    productsData,
    bundlesData,
    offersData,
  );
  const createSourceIdOptions = useResourceIdOptions(
    createSourceType,
    productsData,
    bundlesData,
    offersData,
  );
  const createRelatedIdOptions = useResourceIdOptions(
    createRelatedType,
    productsData,
    bundlesData,
    offersData,
  );

  const {
    data: sources = [],
    isLoading: sourcesLoading,
    isError: sourcesError,
    error: sourcesErr,
  } = useGetRelatedItemSourcesQuery();

  const {
    data: linksRaw = [],
    isLoading: linksLoading,
    isFetching: linksFetching,
  } = useGetRelatedItemsForSourceQuery(
    selectedSource
      ? { source_id: selectedSource.sourceId, source_type: selectedSource.sourceType }
      : { source_id: '0', source_type: 'product' },
    { skip: !selectedSource },
  );

  const linksSorted = useMemo(
    () => [...linksRaw].sort((a, b) => a.sortOrder - b.sortOrder),
    [linksRaw],
  );

  const [createLink, { isLoading: isCreating }] = useCreateRelatedItemMutation();
  const [patchSort, { isLoading: isPatchingSort }] = useUpdateRelatedItemSortMutation();
  const [removeLink, { isLoading: isDeleting }] = useDeleteRelatedItemMutation();

  const catalogsBusy = productsLoading || bundlesLoading || offersLoading;

  function openManage(row: SelectedSource) {
    setSelectedSource(row);
    setManageRelatedType('');
    setManageRelatedId('');
    setManageSortOrder('');
    setSortEdit(null);
  }

  function closeManage() {
    setSelectedSource(null);
    setManageRelatedType('');
    setManageRelatedId('');
    setManageSortOrder('');
    setSortEdit(null);
  }

  function openCreateDrawer() {
    setCreateSourceType('');
    setCreateSourceId('');
    setCreateRelatedType('');
    setCreateRelatedId('');
    setCreateSortOrder('');
    setCreateDrawerOpen(true);
  }

  function closeCreateDrawer() {
    setCreateDrawerOpen(false);
  }

  async function submitAddLink(
    sourceType: RelatedResourceType,
    sourceIdStr: string,
    relatedType: RelatedResourceType,
    relatedIdStr: string,
    sortOrderStr: string,
    onSuccess: () => void,
  ) {
    const source_id = Number(sourceIdStr);
    const related_id = Number(relatedIdStr);
    if (!Number.isFinite(source_id) || source_id <= 0) {
      toast.error('Choose a valid source item.');
      return;
    }
    if (!Number.isFinite(related_id) || related_id <= 0) {
      toast.error('Choose a valid related item.');
      return;
    }
    if (sourceType === relatedType && String(source_id) === String(related_id)) {
      toast.error('Source and related cannot be the same row.');
      return;
    }

    const body: {
      source_type: RelatedResourceType;
      source_id: number;
      related_type: RelatedResourceType;
      related_id: number;
      sort_order?: number;
    } = {
      source_type: sourceType,
      source_id,
      related_type: relatedType,
      related_id,
    };
    if (sortOrderStr.trim() !== '') {
      const n = Number(sortOrderStr);
      if (!Number.isFinite(n) || !Number.isInteger(n)) {
        toast.error('Sort order must be an integer.');
        return;
      }
      body.sort_order = n;
    }

    try {
      await createLink(body).unwrap();
      toast.success('Related link created.');
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error(extractServerMessage(error, 'Could not create link.'));
    }
  }

  async function handleManageAdd(event: FormEvent) {
    event.preventDefault();
    if (!selectedSource) return;
    if (!manageRelatedType || !manageRelatedId) {
      toast.error('Select related resource type and item.');
      return;
    }
    await submitAddLink(
      selectedSource.sourceType,
      selectedSource.sourceId,
      manageRelatedType,
      manageRelatedId,
      manageSortOrder,
      () => {
        setManageRelatedType('');
        setManageRelatedId('');
        setManageSortOrder('');
      },
    );
  }

  async function handleGlobalCreate(event: FormEvent) {
    event.preventDefault();
    if (!createSourceType || !createSourceId || !createRelatedType || !createRelatedId) {
      toast.error('Fill source and related resource type and item.');
      return;
    }
    await submitAddLink(
      createSourceType,
      createSourceId,
      createRelatedType,
      createRelatedId,
      createSortOrder,
      () => {
        closeCreateDrawer();
      },
    );
  }

  async function confirmSaveSort(link: RelatedItemLink) {
    if (!selectedSource || !sortEdit || sortEdit.id !== link.id) return;
    const n = Number(sortEdit.value);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      toast.error('Sort order must be an integer.');
      return;
    }
    try {
      await patchSort({
        id: link.id,
        sort_order: n,
        sourceType: selectedSource.sourceType,
        sourceId: selectedSource.sourceId,
      }).unwrap();
      toast.success('Sort order updated.');
      setSortEdit(null);
    } catch (error) {
      console.error(error);
      toast.error(extractServerMessage(error, 'Could not update sort order.'));
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await removeLink({
        id: deleteTarget.id,
        sourceType: deleteTarget.sourceType,
        sourceId: deleteTarget.sourceId,
      }).unwrap();
      toast.success('Link removed.');
      setDeleteTarget(null);
    } catch (error) {
      console.error(error);
      toast.error(extractServerMessage(error, 'Could not remove link.'));
    }
  }

  return (
    <div className="space-y-4">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={openCreateDrawer}
          className="inline-flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] bg-linear-to-r from-[#050506] via-[#141418] to-[#2a2a31] px-4 py-2 text-sm font-semibold text-[#f8f8fa] shadow-[0_16px_32px_-18px_rgba(0,0,0,0.95)] transition-opacity hover:opacity-95"
        >
          <Plus size={16} aria-hidden />
          Add related link
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e5e7eb]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#e5e7eb] text-left text-sm">
            <thead className="bg-[#f9fafb] text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
              <tr>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Source type</th>
                <th className="px-4 py-3">Source ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3 text-right">Links</th>
                <th className="px-4 py-3 text-right"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb] bg-white">
              {sourcesLoading ? (
                <tr>
                  <td colSpan={6} className="space-y-2 px-4 py-8">
                    <p className="text-center text-xs text-[#6b7280]">Loading sources…</p>
                    <TableDotsLoader className="min-h-[140px]" />
                  </td>
                </tr>
              ) : sourcesError ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-red-600">
                    {extractServerMessage(sourcesErr, 'Failed to load related-item sources.')}
                  </td>
                </tr>
              ) : sources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#6b7280]">
                    No sources with related items yet. Use &quot;Add related link&quot; to create the
                    first link for a product, bundle, or special offer.
                  </td>
                </tr>
              ) : (
                sources.map((row) => (
                  <tr key={`${row.sourceType}-${row.sourceId}`} className="hover:bg-[#fafafa]">
                    <td className="px-4 py-3">
                      {row.imageUrl ? (
                        <img
                          src={row.imageUrl}
                          alt=""
                          className="h-12 w-12 rounded-lg border border-[#e5e7eb] object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-[#e5e7eb] bg-[#f9fafb] text-xs text-[#9ca3af]">
                          —
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#111111]">
                      {resourceTypeLabel(row.sourceType)}
                    </td>
                    <td className="px-4 py-3 font-mono text-[#374151]">{row.sourceId}</td>
                    <td className="px-4 py-3 text-[#374151]">
                      {row.name ?? (
                        <span className="italic text-[#9ca3af]">Missing or deleted</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#111111]">
                      {row.relatedCount}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          openManage({
                            sourceType: row.sourceType,
                            sourceId: row.sourceId,
                            name: row.name,
                          })
                        }
                        className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs font-semibold text-[#111111] hover:bg-[#f9fafb]"
                      >
                        Manage links
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage drawer */}
      {selectedSource ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Close drawer"
            onClick={closeManage}
            className="h-full flex-1 bg-black/40"
          />
          <aside className="flex h-full max-h-screen min-h-0 w-full max-w-lg flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[#eef2f7] px-5 py-4">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-[#111111]">Related items</h3>
                <p className="mt-1 text-xs text-[#6b7280]">
                  {resourceTypeLabel(selectedSource.sourceType)} #{selectedSource.sourceId}
                  {selectedSource.name ? ` · ${selectedSource.name}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={closeManage}
                className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f4f6f8] hover:text-[#111111]"
              >
                <X size={16} />
              </button>
            </header>

            <div
              className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-4"
              data-dashboard-drawer-scroll=""
            >
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                  Current links
                </h4>
                {linksLoading || (linksFetching && linksRaw.length === 0) ? (
                  <div className="space-y-2">
                    <p className="text-xs text-[#6b7280]">Loading links…</p>
                    <TableDotsLoader className="min-h-[120px]" />
                  </div>
                ) : linksSorted.length === 0 ? (
                  <p className="text-sm text-[#6b7280]">No links for this source.</p>
                ) : (
                  <ul className="space-y-2">
                    {linksSorted.map((link) => {
                      const targetName =
                        relatedEntityName(link.related) ??
                        `(removed — ${resourceTypeLabel(link.relatedType)} #${link.relatedId})`;
                      const thumbUrl = relatedEntityImageUrl(link.related, link.relatedType);
                      const editing = sortEdit?.id === link.id;
                      return (
                        <li
                          key={link.id}
                          className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-3 text-sm"
                        >
                          <div className="flex gap-3">
                            <div className="shrink-0 pt-0.5">
                              {thumbUrl ? (
                                <img
                                  src={thumbUrl}
                                  alt=""
                                  className="h-14 w-14 rounded-lg border border-[#e5e7eb] bg-white object-cover"
                                />
                              ) : (
                                <div
                                  className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-[#e5e7eb] bg-white text-xs text-[#9ca3af]"
                                  aria-hidden
                                >
                                  —
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-medium text-[#111111]">{targetName}</p>
                                  <p className="mt-0.5 text-xs text-[#6b7280]">
                                    {resourceTypeLabel(link.relatedType)} · ID {link.relatedId}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteTarget({
                                      id: link.id,
                                      label: targetName,
                                      sourceType: selectedSource.sourceType,
                                      sourceId: selectedSource.sourceId,
                                    })
                                  }
                                  className="shrink-0 rounded-lg p-2 text-[#b91c1c] hover:bg-red-50"
                                  aria-label="Remove link"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                            {editing ? (
                              <>
                                <label className="flex items-center gap-2 text-xs text-[#6b7280]">
                                  Sort order
                                  <input
                                    type="number"
                                    value={sortEdit.value}
                                    onChange={(e) =>
                                      setSortEdit({ id: link.id, value: e.target.value })
                                    }
                                    className="h-9 w-24 rounded-lg border border-[#dbe1ea] px-2 text-sm"
                                  />
                                </label>
                                <button
                                  type="button"
                                  disabled={isPatchingSort}
                                  onClick={() => confirmSaveSort(link)}
                                  className="rounded-lg bg-[#111111] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSortEdit(null)}
                                  className="rounded-lg border border-[#e5e7eb] px-3 py-1.5 text-xs font-medium text-[#374151]"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="text-xs text-[#6b7280]">
                                  Sort: <strong className="text-[#111111]">{link.sortOrder}</strong>
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSortEdit({ id: link.id, value: String(link.sortOrder) })
                                  }
                                  className="text-xs font-semibold text-[#2563eb] hover:underline"
                                >
                                  Edit order
                                </button>
                              </>
                            )}
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <form className="space-y-4 border-t border-[#eef2f7] pt-4" onSubmit={handleManageAdd}>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                  Add link
                </h4>
                {catalogsBusy ? (
                  <p className="text-xs text-[#6b7280]">Loading catalogs…</p>
                ) : null}
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Related resource type</span>
                  <DashboardSelect
                    value={manageRelatedType}
                    onChange={(v) => {
                      setManageRelatedType(v as RelatedResourceType | '');
                      setManageRelatedId('');
                    }}
                    options={RESOURCE_TYPE_OPTIONS}
                    placeholder="Select type…"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Related item</span>
                  <DashboardSelect
                    value={manageRelatedId}
                    onChange={setManageRelatedId}
                    options={manageIdOptions}
                    placeholder="Select item…"
                    disabled={!manageRelatedType}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Sort order <span className="font-normal text-[#9ca3af]">(optional)</span>
                  </span>
                  <input
                    type="number"
                    value={manageSortOrder}
                    onChange={(e) => setManageSortOrder(e.target.value)}
                    placeholder="Append after max if empty"
                    className="h-11 w-full rounded-xl border border-[#dbe1ea] px-3 text-sm"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isCreating || !manageRelatedType || !manageRelatedId}
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-linear-to-r from-[#050506] via-[#141418] to-[#2a2a31] py-2.5 text-sm font-semibold text-[#f8f8fa] disabled:opacity-60"
                >
                  {isCreating ? 'Adding…' : 'Add link'}
                </button>
              </form>
            </div>
          </aside>
        </div>
      ) : null}

      {/* Global create drawer */}
      {createDrawerOpen ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Close drawer"
            onClick={closeCreateDrawer}
            className="h-full flex-1 bg-black/40"
          />
          <aside className="flex h-full max-h-screen min-h-0 w-full max-w-md flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[#eef2f7] px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-[#111111]">Add related link</h3>
                <p className="mt-1 text-xs text-[#6b7280]">
                  Choose source and related resources. Product 18 and bundle 18 are different
                  sources.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreateDrawer}
                className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f4f6f8] hover:text-[#111111]"
              >
                <X size={16} />
              </button>
            </header>
            <form
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
              onSubmit={handleGlobalCreate}
            >
              <div
                className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5"
                data-dashboard-drawer-scroll=""
              >
                {catalogsBusy ? (
                  <p className="text-xs text-[#6b7280]">Loading catalogs…</p>
                ) : null}
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Source resource type</span>
                  <DashboardSelect
                    value={createSourceType}
                    onChange={(v) => {
                      setCreateSourceType(v as RelatedResourceType | '');
                      setCreateSourceId('');
                    }}
                    options={RESOURCE_TYPE_OPTIONS}
                    placeholder="Select type…"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Source item</span>
                  <DashboardSelect
                    value={createSourceId}
                    onChange={setCreateSourceId}
                    options={createSourceIdOptions}
                    placeholder="Select item…"
                    disabled={!createSourceType}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Related resource type</span>
                  <DashboardSelect
                    value={createRelatedType}
                    onChange={(v) => {
                      setCreateRelatedType(v as RelatedResourceType | '');
                      setCreateRelatedId('');
                    }}
                    options={RESOURCE_TYPE_OPTIONS}
                    placeholder="Select type…"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Related item</span>
                  <DashboardSelect
                    value={createRelatedId}
                    onChange={setCreateRelatedId}
                    options={createRelatedIdOptions}
                    placeholder="Select item…"
                    disabled={!createRelatedType}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Sort order <span className="font-normal text-[#9ca3af]">(optional)</span>
                  </span>
                  <input
                    type="number"
                    value={createSortOrder}
                    onChange={(e) => setCreateSortOrder(e.target.value)}
                    placeholder="Append after max if empty"
                    className="h-11 w-full rounded-xl border border-[#dbe1ea] px-3 text-sm"
                  />
                </label>
              </div>
              <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#eef2f7] bg-white px-5 py-4">
                <button
                  type="button"
                  onClick={closeCreateDrawer}
                  className="rounded-xl border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f8fafc]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isCreating ||
                    !createSourceType ||
                    !createSourceId ||
                    !createRelatedType ||
                    !createRelatedId
                  }
                  className="rounded-xl border border-[rgba(255,255,255,0.1)] bg-linear-to-r from-[#050506] via-[#141418] to-[#2a2a31] px-4 py-2 text-sm font-semibold text-[#f8f8fa] disabled:opacity-60"
                >
                  {isCreating ? 'Creating…' : 'Create link'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-xl">
            <h4 className="text-lg font-semibold text-[#111111]">Remove link?</h4>
            <p className="mt-2 text-sm text-[#6b7280]">
              This removes the relation to <span className="font-medium">{deleteTarget.label}</span>.
              The target product, bundle, or offer is not deleted.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="rounded-xl bg-[#b91c1c] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isDeleting ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
