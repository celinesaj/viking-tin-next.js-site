'use client';

import { Film, Plus, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useGetDashboardBrandsQuery } from '@/app/dashboard/redux/reducers/BrandsSlice/BrandsApiSlice';
import { useGetDashboardStrengthLevelsQuery } from '@/app/dashboard/redux/reducers/StrengthLevelsSlice/StrengthLevelsApiSlice';
import ProductDescriptionField from '@/app/dashboard/_components/ProductDescriptionField';
import DashboardSelect from '@/app/dashboard/_components/DashboardSelect';
import FieldError from '@/app/dashboard/_components/FieldError';
import ProductFormSwitch from '@/app/dashboard/_components/ProductFormSwitch';
import {
  BRAND_SLUG_MAX,
  BRAND_SLUG_MIN,
  DASHBOARD_IMAGE_MAX_BYTES,
  PRODUCT_DESCRIPTION_MAX,
  PRODUCT_HOOK_MAX,
  PRODUCT_MEDIA_MAX_FILES,
  PRODUCT_META_DESCRIPTION_MAX,
  PRODUCT_META_TITLE_MAX,
  PRODUCT_NAME_MAX,
  PRODUCT_NICOTINE_MG_MAX,
  createProductFormSchema,
  fieldErrorsFromZod,
  normalizeBrandSlugInput,
  resolveOptionalSlug,
} from '@/app/dashboard/_validation/dashboardForms';
import { useGetFlavorsQuery } from '@/features/flavours/flavoursApi';
import { useCreateProductMutation } from '@/features/products/productsApi';

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

function inputBorderClass(hasError: boolean) {
  return hasError ? 'border-red-500' : 'border-[#dbe1ea]';
}

const LIST_LIMIT = 200;
const mediaMb = DASHBOARD_IMAGE_MAX_BYTES / (1024 * 1024);

export default function AddProductDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    brandId: '',
    flavorId: '',
    strengthId: '',
    name: '',
    slug: '',
    nicotineMg: '',
    price: '',
    stock: '',
    description: '',
    pouchCount: '',
    weightGrams: '',
    manufacturer: '',
    metaTitle: '',
    metaDescription: '',
    hook: '',
    isActive: true,
    isBestSelling: false,
  });
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaInputKey, setMediaInputKey] = useState(0);
  const [coverGifFile, setCoverGifFile] = useState<File | null>(null);
  const [coverGifInputKey, setCoverGifInputKey] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [createProduct, { isLoading }] = useCreateProductMutation();

  const mediaPreviewUrls = useMemo(
    () =>
      mediaFiles.map((f) =>
        typeof window !== 'undefined' && f.type.startsWith('image/')
          ? URL.createObjectURL(f)
          : null,
      ),
    [mediaFiles],
  );

  const coverGifPreviewUrl = useMemo(
    () =>
      coverGifFile &&
      typeof window !== 'undefined' &&
      (coverGifFile.type.startsWith('image/') || coverGifFile.type.startsWith('video/'))
        ? URL.createObjectURL(coverGifFile)
        : null,
    [coverGifFile],
  );

  useEffect(() => {
    return () => {
      mediaPreviewUrls.forEach((u) => {
        if (u) URL.revokeObjectURL(u);
      });
    };
  }, [mediaPreviewUrls]);

  useEffect(() => {
    return () => {
      if (coverGifPreviewUrl) URL.revokeObjectURL(coverGifPreviewUrl);
    };
  }, [coverGifPreviewUrl]);

  const { data: brands = [], isLoading: brandsLoading } = useGetDashboardBrandsQuery();
  const { data: flavorsRes, isLoading: flavorsLoading } = useGetFlavorsQuery({
    page: 1,
    limit: LIST_LIMIT,
  });
  const { data: strengthRes, isLoading: strengthLoading } = useGetDashboardStrengthLevelsQuery({
    page: 1,
    limit: LIST_LIMIT,
  });

  const brandOptions = useMemo(
    () => [...brands].sort((a, b) => a.name.localeCompare(b.name)),
    [brands],
  );
  const flavorOptions = useMemo(() => {
    const list = flavorsRes?.data ?? [];
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [flavorsRes?.data]);
  const strengthOptions = useMemo(() => {
    const list = strengthRes?.data ?? [];
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [strengthRes?.data]);

  const listsLoading = brandsLoading || flavorsLoading || strengthLoading;

  const brandSelectOptions = useMemo(
    () => [
      { value: '', label: 'Select brand' },
      ...brandOptions.map((b) => ({ value: String(b.id), label: b.name })),
    ],
    [brandOptions],
  );
  const flavorSelectOptions = useMemo(
    () => [
      { value: '', label: 'Select flavor' },
      ...flavorOptions.map((f) => ({ value: String(f.id), label: f.name })),
    ],
    [flavorOptions],
  );
  const strengthSelectOptions = useMemo(
    () => [
      { value: '', label: 'Select strength' },
      ...strengthOptions.map((s) => ({ value: String(s.id), label: s.name })),
    ],
    [strengthOptions],
  );

  function clearError(key: string) {
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleOpen() {
    setForm({
      brandId: '',
      flavorId: '',
      strengthId: '',
      name: '',
      slug: '',
      nicotineMg: '',
      price: '',
      stock: '',
      description: '',
      pouchCount: '',
      weightGrams: '',
      manufacturer: '',
      metaTitle: '',
      metaDescription: '',
      hook: '',
      isActive: true,
      isBestSelling: false,
    });
    setMediaFiles([]);
    setMediaInputKey((k) => k + 1);
    setCoverGifFile(null);
    setCoverGifInputKey((k) => k + 1);
    setFieldErrors({});
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
    setMediaFiles([]);
    setMediaInputKey((k) => k + 1);
    setCoverGifFile(null);
    setCoverGifInputKey((k) => k + 1);
    setFieldErrors({});
  }

  function removeMediaAt(index: number) {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    clearError('media');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = createProductFormSchema.safeParse({
      brand_id: form.brandId,
      flavor_id: form.flavorId,
      strength_id: form.strengthId,
      name: form.name,
      slug: resolveOptionalSlug(form.slug, form.name),
      nicotine_mg: form.nicotineMg,
      price: form.price,
      stock: form.stock,
      description: form.description,
      pouch_count: form.pouchCount,
      weight_grams: form.weightGrams,
      manufacturer: form.manufacturer,
      meta_title: form.metaTitle,
      meta_description: form.metaDescription,
      hook: form.hook,
      is_active: form.isActive,
      is_best_selling: form.isBestSelling,
      media: mediaFiles.length > 0 ? mediaFiles : undefined,
      cover_gif: coverGifFile ?? undefined,
    });
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    setFieldErrors({});
    const d = parsed.data;

    try {
      await createProduct({
        brand_id: d.brand_id,
        flavor_id: d.flavor_id,
        strength_id: d.strength_id,
        name: d.name,
        slug: d.slug.trim() !== '' ? d.slug.trim() : undefined,
        nicotine_mg: d.nicotine_mg,
        price: d.price,
        stock: d.stock,
        description: d.description,
        pouch_count: typeof d.pouch_count === 'number' ? d.pouch_count : undefined,
        weight_grams: typeof d.weight_grams === 'number' ? d.weight_grams : undefined,
        manufacturer: d.manufacturer,
        meta_title: d.meta_title,
        meta_description: d.meta_description,
        hook: d.hook,
        is_active: d.is_active,
        is_best_selling: d.is_best_selling,
        media: d.media && d.media.length > 0 ? d.media : undefined,
        cover_gif: d.cover_gif,
      }).unwrap();
      toast.success(`"${d.name}" created successfully.`);
      handleClose();
    } catch (error) {
      console.error('Failed to create product', error);
      toast.error(extractServerMessage(error, 'Create failed. Please try again.'));
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] bg-linear-to-r from-[#050506] via-[#141418] to-[#2a2a31] px-4 py-2 text-sm font-semibold text-[#f8f8fa] shadow-[0_16px_32px_-18px_rgba(0,0,0,0.95)] transition-opacity hover:opacity-95"
        >
          <Plus size={16} />
          <span>Add Product</span>
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Close add product overlay"
            onClick={handleClose}
            className="h-full flex-1 bg-black/40"
          />

          <aside className="flex h-full max-h-screen min-h-0 w-full max-w-lg flex-col border-l border-[#e5e7eb] bg-white shadow-2xl">
            <header className="shrink-0 flex items-center justify-between border-b border-[#eef2f7] px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-[#111111]">Add Product</h3>
                <p className="mt-1 text-xs text-[#6b7280]">
                  POST /products (multipart). Required: brand, flavor, strength, name, nicotine,
                  price, stock. Optional motion cover (GIF or MP4) and media (up to{' '}
                  {PRODUCT_MEDIA_MAX_FILES} files, {mediaMb} MB each).
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f4f6f8] hover:text-[#111111]"
              >
                <X size={16} />
              </button>
            </header>

            <form
              noValidate
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5">
                {listsLoading ? (
                  <p className="text-xs text-[#6b7280]">Loading brands, flavors, and strength levels…</p>
                ) : null}

                <div className="block space-y-1.5">
                  <label
                    htmlFor="product-add-brand-select"
                    className="text-sm font-medium text-[#111111]"
                  >
                    Brand <span className="text-red-600">*</span>
                  </label>
                  <DashboardSelect
                    id="product-add-brand-select"
                    value={form.brandId}
                    onChange={(v) => {
                      setForm((p) => ({ ...p, brandId: v }));
                      clearError('brand_id');
                    }}
                    options={brandSelectOptions}
                    placeholder="Select brand"
                    disabled={isLoading}
                    hasError={Boolean(fieldErrors.brand_id)}
                    aria-required
                    aria-invalid={Boolean(fieldErrors.brand_id)}
                    aria-describedby={fieldErrors.brand_id ? 'product-add-brand-err' : undefined}
                  />
                  <FieldError id="product-add-brand-err" message={fieldErrors.brand_id} />
                </div>

                <div className="block space-y-1.5">
                  <label
                    htmlFor="product-add-flavor-select"
                    className="text-sm font-medium text-[#111111]"
                  >
                    Flavor <span className="text-red-600">*</span>
                  </label>
                  <DashboardSelect
                    id="product-add-flavor-select"
                    value={form.flavorId}
                    onChange={(v) => {
                      setForm((p) => ({ ...p, flavorId: v }));
                      clearError('flavor_id');
                    }}
                    options={flavorSelectOptions}
                    placeholder="Select flavor"
                    disabled={isLoading}
                    hasError={Boolean(fieldErrors.flavor_id)}
                    aria-required
                    aria-invalid={Boolean(fieldErrors.flavor_id)}
                    aria-describedby={fieldErrors.flavor_id ? 'product-add-flavor-err' : undefined}
                  />
                  <FieldError id="product-add-flavor-err" message={fieldErrors.flavor_id} />
                </div>

                <div className="block space-y-1.5">
                  <label
                    htmlFor="product-add-strength-select"
                    className="text-sm font-medium text-[#111111]"
                  >
                    Strength level <span className="text-red-600">*</span>
                  </label>
                  <DashboardSelect
                    id="product-add-strength-select"
                    value={form.strengthId}
                    onChange={(v) => {
                      setForm((p) => ({ ...p, strengthId: v }));
                      clearError('strength_id');
                    }}
                    options={strengthSelectOptions}
                    placeholder="Select strength"
                    disabled={isLoading}
                    hasError={Boolean(fieldErrors.strength_id)}
                    aria-required
                    aria-invalid={Boolean(fieldErrors.strength_id)}
                    aria-describedby={
                      fieldErrors.strength_id ? 'product-add-strength-err' : undefined
                    }
                  />
                  <FieldError id="product-add-strength-err" message={fieldErrors.strength_id} />
                </div>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">
                    Name <span className="text-red-600">*</span>
                  </span>
                  <input
                    type="text"
                    value={form.name}
                    maxLength={PRODUCT_NAME_MAX}
                    aria-required
                    aria-invalid={Boolean(fieldErrors.name)}
                    aria-describedby={fieldErrors.name ? 'product-add-name-err' : undefined}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, name: e.target.value }));
                      clearError('name');
                    }}
                    placeholder="e.g. Viking Mint Ice"
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.name))}`}
                  />
                  <FieldError id="product-add-name-err" message={fieldErrors.name} />
                  <p className="text-xs text-[#9ca3af]">
                    {form.name.trim().length}/{PRODUCT_NAME_MAX}
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Slug</span>
                  <input
                    type="text"
                    value={form.slug}
                    maxLength={BRAND_SLUG_MAX}
                    aria-invalid={Boolean(fieldErrors.slug)}
                    aria-describedby={fieldErrors.slug ? 'product-add-slug-err' : undefined}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, slug: normalizeBrandSlugInput(e.target.value) }));
                      clearError('slug');
                    }}
                    placeholder="e.g. viking-mint-ice"
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.slug))}`}
                  />
                  <FieldError id="product-add-slug-err" message={fieldErrors.slug} />
                  <p className="text-xs text-[#9ca3af]">
                    {form.slug.length}/{BRAND_SLUG_MAX} (optional; min {BRAND_SLUG_MIN} chars if set)
                  </p>
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">
                      Nicotine (mg) <span className="text-red-600">*</span>
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={form.nicotineMg}
                      aria-required
                      aria-invalid={Boolean(fieldErrors.nicotine_mg)}
                      aria-describedby={
                        fieldErrors.nicotine_mg
                          ? 'product-add-nic-err product-add-nic-hint'
                          : 'product-add-nic-hint'
                      }
                      onChange={(e) => {
                        setForm((p) => ({ ...p, nicotineMg: e.target.value }));
                        clearError('nicotine_mg');
                      }}
                      placeholder="12.5"
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.nicotine_mg))}`}
                    />
                    <FieldError id="product-add-nic-err" message={fieldErrors.nicotine_mg} />
                    <p id="product-add-nic-hint" className="text-xs text-[#9ca3af]">
                      Max {PRODUCT_NICOTINE_MG_MAX} mg (matches database precision).
                    </p>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">
                      Price <span className="text-red-600">*</span>
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={form.price}
                      aria-required
                      aria-invalid={Boolean(fieldErrors.price)}
                      aria-describedby={fieldErrors.price ? 'product-add-price-err' : undefined}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, price: e.target.value }));
                        clearError('price');
                      }}
                      placeholder="14.99"
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.price))}`}
                    />
                    <FieldError id="product-add-price-err" message={fieldErrors.price} />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">
                      Stock <span className="text-red-600">*</span>
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.stock}
                      aria-required
                      aria-invalid={Boolean(fieldErrors.stock)}
                      aria-describedby={fieldErrors.stock ? 'product-add-stock-err' : undefined}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, stock: e.target.value }));
                        clearError('stock');
                      }}
                      placeholder="100"
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.stock))}`}
                    />
                    <FieldError id="product-add-stock-err" message={fieldErrors.stock} />
                  </label>
                </div>

                <ProductDescriptionField
                  label="Description"
                  value={form.description}
                  maxLength={PRODUCT_DESCRIPTION_MAX}
                  error={fieldErrors.description}
                  linkSource="products-and-blogs"
                  placeholder="Description — select text, then + Link → product, blog, or Website URL"
                  onChange={(text) => {
                    setForm((p) => ({ ...p, description: text }));
                    clearError('description');
                  }}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">Pouch count</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.pouchCount}
                      aria-invalid={Boolean(fieldErrors.pouch_count)}
                      aria-describedby={
                        fieldErrors.pouch_count ? 'product-add-pouch-err' : undefined
                      }
                      onChange={(e) => {
                        setForm((p) => ({ ...p, pouchCount: e.target.value }));
                        clearError('pouch_count');
                      }}
                      placeholder="20"
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.pouch_count))}`}
                    />
                    <FieldError id="product-add-pouch-err" message={fieldErrors.pouch_count} />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-[#111111]">Weight (g)</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={form.weightGrams}
                      aria-invalid={Boolean(fieldErrors.weight_grams)}
                      aria-describedby={
                        fieldErrors.weight_grams ? 'product-add-weight-err' : undefined
                      }
                      onChange={(e) => {
                        setForm((p) => ({ ...p, weightGrams: e.target.value }));
                        clearError('weight_grams');
                      }}
                      placeholder="16"
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.weight_grams))}`}
                    />
                    <FieldError id="product-add-weight-err" message={fieldErrors.weight_grams} />
                  </label>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Manufacturer</span>
                  <input
                    type="text"
                    value={form.manufacturer}
                    aria-invalid={Boolean(fieldErrors.manufacturer)}
                    aria-describedby={
                      fieldErrors.manufacturer ? 'product-add-mfr-err' : undefined
                    }
                    onChange={(e) => {
                      setForm((p) => ({ ...p, manufacturer: e.target.value }));
                      clearError('manufacturer');
                    }}
                    placeholder="e.g. Viking Labs"
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.manufacturer))}`}
                  />
                  <FieldError id="product-add-mfr-err" message={fieldErrors.manufacturer} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Meta title</span>
                  <input
                    type="text"
                    value={form.metaTitle}
                    maxLength={PRODUCT_META_TITLE_MAX}
                    aria-invalid={Boolean(fieldErrors.meta_title)}
                    aria-describedby={fieldErrors.meta_title ? 'product-add-meta-title-err' : undefined}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, metaTitle: e.target.value }));
                      clearError('meta_title');
                    }}
                    placeholder="SEO meta title"
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.meta_title))}`}
                  />
                  <FieldError id="product-add-meta-title-err" message={fieldErrors.meta_title} />
                  <p className="text-xs text-[#9ca3af]">
                    {form.metaTitle.trim().length}/{PRODUCT_META_TITLE_MAX}
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Meta description</span>
                  <textarea
                    value={form.metaDescription}
                    maxLength={PRODUCT_META_DESCRIPTION_MAX}
                    aria-invalid={Boolean(fieldErrors.meta_description)}
                    aria-describedby={
                      fieldErrors.meta_description ? 'product-add-meta-description-err' : undefined
                    }
                    onChange={(e) => {
                      setForm((p) => ({ ...p, metaDescription: e.target.value }));
                      clearError('meta_description');
                    }}
                    placeholder="SEO meta description"
                    rows={3}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.meta_description))}`}
                  />
                  <FieldError
                    id="product-add-meta-description-err"
                    message={fieldErrors.meta_description}
                  />
                  <p className="text-xs text-[#9ca3af]">
                    {form.metaDescription.trim().length}/{PRODUCT_META_DESCRIPTION_MAX}
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[#111111]">Hook</span>
                  <textarea
                    value={form.hook}
                    maxLength={PRODUCT_HOOK_MAX}
                    aria-invalid={Boolean(fieldErrors.hook)}
                    aria-describedby={fieldErrors.hook ? 'product-add-hook-err' : undefined}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, hook: e.target.value }));
                      clearError('hook');
                    }}
                    placeholder="Short marketing hook"
                    rows={2}
                    className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-[#111111] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#111111] ${inputBorderClass(Boolean(fieldErrors.hook))}`}
                  />
                  <FieldError id="product-add-hook-err" message={fieldErrors.hook} />
                  <p className="text-xs text-[#9ca3af]">
                    {form.hook.trim().length}/{PRODUCT_HOOK_MAX}
                  </p>
                </label>

                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                  <ProductFormSwitch
                    label="Active"
                    variant="emerald"
                    checked={form.isActive}
                    disabled={isLoading}
                    onCheckedChange={(next) => {
                      setForm((p) => ({ ...p, isActive: next }));
                      clearError('is_active');
                    }}
                  />
                  <ProductFormSwitch
                    label="Best selling"
                    variant="amber"
                    checked={form.isBestSelling}
                    disabled={isLoading}
                    onCheckedChange={(next) => {
                      setForm((p) => ({ ...p, isBestSelling: next }));
                      clearError('is_best_selling');
                    }}
                  />
                </div>

                <div className="space-y-4 border-t border-[#eef2f7] pt-4">
                  <span className="text-sm font-medium text-[#111111]">Motion cover (optional)</span>
                  <p className="text-xs text-[#6b7280]">
                    Optional animated GIF or short MP4. Leave empty to skip; max {mediaMb} MB.
                  </p>
                  <div className="space-y-2">
                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-[#374151]">
                          Motion cover (cover_gif) — GIF or MP4
                        </span>
                        <input
                          key={coverGifInputKey}
                          type="file"
                          accept="image/gif,.gif,video/mp4,.mp4,video/webm,.webm,video/quicktime,.mov"
                          aria-invalid={Boolean(fieldErrors.cover_gif)}
                          aria-describedby={
                            fieldErrors.cover_gif
                              ? 'product-add-cover-gif-err product-add-cover-gif-hint'
                              : 'product-add-cover-gif-hint'
                          }
                          onChange={(e) => {
                            const f = e.target.files?.[0] ?? null;
                            setCoverGifFile(f);
                            clearError('cover_gif');
                            e.target.value = '';
                          }}
                          disabled={isLoading}
                          className="block w-full text-sm text-[#374151] file:mr-4 file:rounded-lg file:border-0 file:bg-[#eef2f7] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#111111] hover:file:bg-[#e5e7eb] disabled:opacity-50"
                        />
                        <FieldError id="product-add-cover-gif-err" message={fieldErrors.cover_gif} />
                        <p id="product-add-cover-gif-hint" className="text-[11px] text-[#9ca3af]">
                          Optional animated GIF or short MP4 (same size limit as images).
                        </p>
                      </label>
                      {coverGifPreviewUrl ? (
                        <div className="relative aspect-video max-h-32 overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f9fafb]">
                          {coverGifFile?.type.startsWith('video/') ? (
                            <video
                              src={coverGifPreviewUrl}
                              className="h-full w-full object-cover"
                              muted
                              playsInline
                              controls
                              preload="metadata"
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={coverGifPreviewUrl}
                              alt="Motion cover preview"
                              className="h-full w-full object-cover"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setCoverGifFile(null);
                              setCoverGifInputKey((k) => k + 1);
                              clearError('cover_gif');
                            }}
                            aria-label="Remove motion cover"
                            className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-lg bg-black/55 text-white hover:bg-black/70"
                          >
                            <X size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      ) : null}
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-sm font-medium text-[#111111]">Images / media (optional)</span>
                  <input
                    key={mediaInputKey}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    aria-invalid={Boolean(fieldErrors.media)}
                    aria-describedby={
                      fieldErrors.media
                        ? 'product-add-media-err product-add-media-hint'
                        : 'product-add-media-hint'
                    }
                    onChange={(e) => {
                      const picked = e.target.files ? Array.from(e.target.files) : [];
                      setMediaFiles((prev) => {
                        const merged = [...prev, ...picked];
                        return merged.slice(0, PRODUCT_MEDIA_MAX_FILES);
                      });
                      clearError('media');
                      e.target.value = '';
                    }}
                    className="block w-full text-sm text-[#374151] file:mr-4 file:rounded-lg file:border-0 file:bg-[#eef2f7] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#111111] hover:file:bg-[#e5e7eb]"
                  />
                  <FieldError id="product-add-media-err" message={fieldErrors.media} />
                  <p id="product-add-media-hint" className="text-xs text-[#6b7280]">
                    Select several files at once, or choose again to add more (max{' '}
                    {PRODUCT_MEDIA_MAX_FILES}, {mediaMb} MB each). Remove a preview to drop a file
                    before submit.
                  </p>

                  {mediaFiles.length > 0 ? (
                    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label="Selected media">
                      {mediaFiles.map((file, index) => {
                        const previewUrl = mediaPreviewUrls[index];
                        return (
                          <li
                            key={`${file.name}-${file.size}-${index}`}
                            className="group relative aspect-square overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f9fafb]"
                          >
                            {previewUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={previewUrl}
                                alt={file.name ? `Preview ${file.name}` : `Preview ${index + 1}`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center">
                                <Film className="h-8 w-8 text-[#9ca3af]" aria-hidden />
                                <span className="line-clamp-2 text-[10px] font-medium text-[#6b7280]">
                                  {file.name || 'Video / file'}
                                </span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removeMediaAt(index)}
                              aria-label={`Remove ${file.name || 'file'}`}
                              className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-lg bg-black/55 text-white shadow-sm transition-opacity hover:bg-black/70 sm:opacity-90 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                            >
                              <X size={14} strokeWidth={2.5} />
                            </button>
                            <span className="pointer-events-none absolute bottom-0 left-0 right-0 truncate bg-linear-to-t from-black/60 to-transparent px-1.5 pb-1 pt-4 text-[10px] text-white">
                              {file.name}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              </div>

              <div className="shrink-0 flex items-center justify-end gap-2 border-t border-[#eef2f7] bg-white px-5 py-4 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.08)]">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="rounded-xl border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f8fafc]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || listsLoading}
                  className="rounded-xl border border-[rgba(255,255,255,0.1)] bg-linear-to-r from-[#050506] via-[#141418] to-[#2a2a31] px-4 py-2 text-sm font-semibold text-[#f8f8fa] disabled:opacity-70"
                >
                  {isLoading ? 'Creating...' : 'Create Product'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}
