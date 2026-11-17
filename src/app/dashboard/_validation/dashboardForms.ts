import { z } from 'zod';

/** Brand text limits (align with typical API / DB columns) */
export const BRAND_NAME_MIN = 1;
export const BRAND_NAME_MAX = 120;
export const BRAND_SLUG_MIN = 2;
export const BRAND_SLUG_MAX = 80;
export const BRAND_DESCRIPTION_MAX = 2000;
export const BRAND_STORY_MAX = 8000;

/** Strength level text / number limits */
export const STRENGTH_LEVEL_NAME_MIN = 1;
export const STRENGTH_LEVEL_NAME_MAX = 120;
export const STRENGTH_LEVEL_SLUG_MIN = 2;
export const STRENGTH_LEVEL_SLUG_MAX = 80;
export const STRENGTH_LEVEL_SORT_MAX = 99999;

/** Product text / upload limits (POST /products multipart) */
export const PRODUCT_NAME_MAX = 200;
export const PRODUCT_DESCRIPTION_MAX = 10000;
export const PRODUCT_MANUFACTURER_MAX = 200;
export const PRODUCT_META_TITLE_MAX = 200;
export const PRODUCT_META_DESCRIPTION_MAX = 500;
export const PRODUCT_HOOK_MAX = 500;
export const PRODUCT_MEDIA_MAX_FILES = 12;
/** Bundle gallery: same cap as product media (POST /bundles multipart). */
export const BUNDLE_GALLERY_MAX_FILES = PRODUCT_MEDIA_MAX_FILES;
/** Aligns with DB `NUMERIC(3,1)` — max 99.9 (two digits + one decimal). */
export const PRODUCT_NICOTINE_MG_MIN = 0;
export const PRODUCT_NICOTINE_MG_MAX = 99.9;

/** Blog category / post text limits */
export const BLOG_CATEGORY_NAME_MIN = 1;
export const BLOG_CATEGORY_NAME_MAX = 120;
export const BLOG_CATEGORY_SLUG_MIN = 2;
export const BLOG_CATEGORY_SLUG_MAX = 80;
export const BLOG_CATEGORY_DESCRIPTION_MAX = 2000;
export const FAQ_CATEGORY_NAME_MIN = 1;
export const FAQ_CATEGORY_NAME_MAX = 120;
export const FAQ_CATEGORY_SLUG_MIN = 2;
export const FAQ_CATEGORY_SLUG_MAX = 80;
export const FAQ_CATEGORY_DESCRIPTION_MAX = 2000;
export const FAQ_ENTRY_QUESTION_MIN = 1;
export const FAQ_ENTRY_QUESTION_MAX = 500;
export const FAQ_ENTRY_ANSWER_MIN = 1;
export const FAQ_ENTRY_ANSWER_MAX = 5000;
export const FAQ_ENTRY_DISPLAY_ORDER_MAX = 99_999;
export const BLOG_POST_TITLE_MIN = 1;
export const BLOG_POST_TITLE_MAX = 300;
export const BLOG_POST_SLUG_MAX = 120;
export const BLOG_POST_CONTENT_MAX = 200_000;
export const BLOG_POST_AUTHOR_MAX = 200;
export const BLOG_POST_META_TITLE_MAX = 200;
export const BLOG_POST_META_DESC_MAX = 500;
export const BLOG_POST_FEATURED_IMAGE_ALT_MAX = 500;
export const PAGE_TITLE_MIN = 1;
export const PAGE_TITLE_MAX = 220;
export const PAGE_SLUG_MIN = 2;
export const PAGE_SLUG_MAX = 120;
export const PAGE_CONTENT_MAX = 200_000;
export const POINT_OF_SALE_TEXT_MAX = 255;
export const POINT_OF_SALE_DESCRIPTION_MAX = 2000;
export const POINT_OF_SALE_META_DESCRIPTION_MAX = 500;
export const POINT_OF_SALE_COORD_MIN = -90;
export const POINT_OF_SALE_COORD_MAX = 90;
export const POINT_OF_SALE_LONG_MIN = -180;
export const POINT_OF_SALE_LONG_MAX = 180;

/** Hero banner text limits */
export const HERO_HEADLINE_MAX = 500;
export const HERO_SUBHEADLINE_MAX = 500;
export const HERO_POSITION_MAX = 999;

/** Testimonial text limits (POST/PATCH /testimonials multipart) */
export const TESTIMONIAL_NAME_MAX = 120;
export const TESTIMONIAL_ROLE_MAX = 120;
export const TESTIMONIAL_QUOTE_MAX = 2000;
export const TESTIMONIAL_SORT_ORDER_MAX = 99_999;

/** Max upload size for logo / hero image (5 MB) */
export const DASHBOARD_IMAGE_MAX_BYTES = 5 * 5024 * 1024;

const slugPattern = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

/** Digits and at most one decimal point (for mg text inputs). */
export function sanitizeDecimalNumberInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '');
  const dot = cleaned.indexOf('.');
  if (dot === -1) return cleaned;
  return cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, '');
}

function imageFile(label: string) {
  const mb = DASHBOARD_IMAGE_MAX_BYTES / (1024 * 1024);
  return z
    .instanceof(File, { message: `${label} is required` })
    .refine((f) => f.size > 0, { message: `${label} is required` })
    .refine((f) => f.size <= DASHBOARD_IMAGE_MAX_BYTES, {
      message: `${label} must be ${mb} MB or smaller`,
    });
}

/** PATCH hero banner: new file optional when `existing_image_url` is already set. */
function optionalHeroBannerImageFile() {
  const mb = DASHBOARD_IMAGE_MAX_BYTES / (1024 * 1024);
  return z
    .instanceof(File, { message: 'Invalid image file' })
    .refine((f) => f.size > 0, { message: 'Image file is empty' })
    .refine((f) => f.size <= DASHBOARD_IMAGE_MAX_BYTES, {
      message: `Image file must be ${mb} MB or smaller`,
    })
    .optional();
}

function refineUpdateHeroBannerImage(
  data: { image?: File | undefined; existing_image_url: string },
  ctx: z.RefinementCtx,
) {
  const hasNew = data.image instanceof File && data.image.size > 0;
  const hasExisting = data.existing_image_url.trim() !== '';
  if (!hasNew && !hasExisting) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Add an image file',
      path: ['image'],
    });
  }
}

function productMediaFile() {
  const mb = DASHBOARD_IMAGE_MAX_BYTES / (1024 * 1024);
  return z
    .instanceof(File, { message: 'Invalid media file' })
    .refine((f) => f.size > 0, { message: 'Media file is empty' })
    .refine((f) => f.size <= DASHBOARD_IMAGE_MAX_BYTES, {
      message: `Each media file must be ${mb} MB or smaller`,
    });
}

/** POST/PATCH product — optional static cover (JPEG, PNG, WebP; not GIF). */
function optionalProductCoverImageFile() {
  const mb = DASHBOARD_IMAGE_MAX_BYTES / (1024 * 1024);
  return z
    .instanceof(File, { message: 'Invalid cover image file' })
    .refine((f) => f.size > 0, { message: 'Cover image file is empty' })
    .refine((f) => f.size <= DASHBOARD_IMAGE_MAX_BYTES, {
      message: `Cover image must be ${mb} MB or smaller`,
    })
    .refine((f) => {
      const mime = f.type.toLowerCase();
      const name = f.name.toLowerCase();
      if (mime === 'image/gif' || name.endsWith('.gif')) return false;
      const staticMime =
        mime === 'image/jpeg' || mime === 'image/png' || mime === 'image/webp';
      const staticExt = /\.(jpe?g|png|webp)$/i.test(name);
      return staticMime || staticExt;
    }, {
      message:
        'Static cover must be JPEG, PNG, or WebP (not GIF). Use “GIF cover” for animated .gif files.',
    })
    .optional();
}

/** POST/PATCH product — optional motion cover: animated GIF or short MP4/WebM/MOV. */
function optionalProductCoverGifFile() {
  const mb = DASHBOARD_IMAGE_MAX_BYTES / (1024 * 1024);
  return z
    .instanceof(File, { message: 'Invalid motion cover file' })
    .refine((f) => f.size > 0, { message: 'Motion cover file is empty' })
    .refine((f) => f.size <= DASHBOARD_IMAGE_MAX_BYTES, {
      message: `Motion cover must be ${mb} MB or smaller`,
    })
    .refine((f) => {
      const mime = f.type.toLowerCase();
      const name = f.name.toLowerCase();
      const isGif = mime === 'image/gif' || name.endsWith('.gif');
      const isVideo =
        mime === 'video/mp4' ||
        mime === 'video/webm' ||
        mime === 'video/quicktime' ||
        name.endsWith('.mp4') ||
        name.endsWith('.webm') ||
        name.endsWith('.mov') ||
        name.endsWith('.m4v');
      return isGif || isVideo;
    }, {
      message:
        'Motion cover must be .gif (image/gif) or a short video (.mp4, .webm, .mov).',
    })
    .optional();
}

/** Empty string from optional number inputs → omit field */
function optionalNumberFromString(schema: z.ZodTypeAny) {
  return z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    schema.optional(),
  );
}

function refineHeroBannerDateOrder(data: { start_date: string; end_date: string }, ctx: z.RefinementCtx) {
  const start = data.start_date.trim();
  const end = data.end_date.trim();

  if (end && !start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Start date is required when end date is set.',
      path: ['start_date'],
    });
    return;
  }

  if (!start || !end) return;

  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return;

  if (endMs < startMs) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'End date must be on or after start date.',
      path: ['end_date'],
    });
  }
}

const brandNameSchema = z
  .string()
  .trim()
  .min(BRAND_NAME_MIN, `Name must be at least ${BRAND_NAME_MIN} character(s)`)
  .max(BRAND_NAME_MAX, `Name must be at most ${BRAND_NAME_MAX} characters`);

/** Create: slug optional; if provided, must meet min/max and pattern */
const createBrandSlugSchema = z
  .string()
  .trim()
  .max(BRAND_SLUG_MAX, `Slug must be at most ${BRAND_SLUG_MAX} characters`)
  .superRefine((val, ctx) => {
    if (val.length === 0) return;
    if (val.length < BRAND_SLUG_MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Slug must be at least ${BRAND_SLUG_MIN} characters or left empty`,
        path: ['slug'],
      });
      return;
    }
    if (!slugPattern.test(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Slug may only use lowercase letters, numbers, and underscores (e.g. my_brand_name)',
        path: ['slug'],
      });
    }
  });

const updateBrandSlugSchema = z
  .string()
  .trim()
  .min(BRAND_SLUG_MIN, `Slug must be at least ${BRAND_SLUG_MIN} characters`)
  .max(BRAND_SLUG_MAX, `Slug must be at most ${BRAND_SLUG_MAX} characters`)
  .regex(slugPattern, {
    message: 'Slug may only use lowercase letters, numbers, and underscores (e.g. my_brand_name)',
  });

const brandDescriptionSchema = z
  .string()
  .trim()
  .max(BRAND_DESCRIPTION_MAX, `Description must be at most ${BRAND_DESCRIPTION_MAX} characters`);

const brandStorySchema = z
  .string()
  .trim()
  .max(BRAND_STORY_MAX, `Story must be at most ${BRAND_STORY_MAX} characters`);

const brandStatusSchema = z.enum(['active', 'inactive']);

export const createBrandFormSchema = z.object({
  name: brandNameSchema,
  slug: createBrandSlugSchema,
  description: brandDescriptionSchema,
  story: brandStorySchema,
  logo: imageFile('Logo file'),
  status: brandStatusSchema,
});

/** Edit brand: new logo optional when the API already returned logoUrl. */
export const updateBrandFormSchema = z
  .object({
    name: brandNameSchema,
    slug: updateBrandSlugSchema,
    description: z
      .string()
      .trim()
      .max(BRAND_DESCRIPTION_MAX, `Description must be at most ${BRAND_DESCRIPTION_MAX} characters`),
    story: z
      .string()
      .trim()
      .max(BRAND_STORY_MAX, `Story must be at most ${BRAND_STORY_MAX} characters`),
    logo: imageFile('Logo file').optional(),
    status: brandStatusSchema,
    existingLogoUrl: z.string().nullable(),
  })
  .superRefine((data, ctx) => {
    const hasExisting = Boolean(data.existingLogoUrl?.trim());
    if (!hasExisting && data.logo === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Logo file is required',
        path: ['logo'],
      });
    }
  });

const strengthLevelNameSchema = z
  .string()
  .trim()
  .min(
    STRENGTH_LEVEL_NAME_MIN,
    `Name must be at least ${STRENGTH_LEVEL_NAME_MIN} character(s)`,
  )
  .max(
    STRENGTH_LEVEL_NAME_MAX,
    `Name must be at most ${STRENGTH_LEVEL_NAME_MAX} characters`,
  );

const createStrengthLevelSlugSchema = z
  .string()
  .trim()
  .max(STRENGTH_LEVEL_SLUG_MAX, `Slug must be at most ${STRENGTH_LEVEL_SLUG_MAX} characters`)
  .superRefine((val, ctx) => {
    if (val.length === 0) return;
    if (val.length < STRENGTH_LEVEL_SLUG_MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Slug must be at least ${STRENGTH_LEVEL_SLUG_MIN} characters or left empty`,
        path: ['slug'],
      });
      return;
    }
    if (!slugPattern.test(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Slug may only use lowercase letters, numbers, and underscores (e.g. medium_strength)',
        path: ['slug'],
      });
    }
  });

const updateStrengthLevelSlugSchema = z
  .string()
  .trim()
  .min(STRENGTH_LEVEL_SLUG_MIN, `Slug must be at least ${STRENGTH_LEVEL_SLUG_MIN} characters`)
  .max(STRENGTH_LEVEL_SLUG_MAX, `Slug must be at most ${STRENGTH_LEVEL_SLUG_MAX} characters`)
  .regex(slugPattern, {
    message: 'Slug may only use lowercase letters, numbers, and underscores (e.g. medium_strength)',
  });

const strengthLevelSortOrderSchema = z.coerce
  .number()
  .finite()
  .int('Sort order must be a whole number')
  .min(0, 'Sort order must be 0 or greater')
  .max(STRENGTH_LEVEL_SORT_MAX, `Sort order must be at most ${STRENGTH_LEVEL_SORT_MAX}`);

export const createStrengthLevelFormSchema = z.object({
  name: strengthLevelNameSchema,
  slug: createStrengthLevelSlugSchema,
  sortOrder: strengthLevelSortOrderSchema,
});

export const updateStrengthLevelFormSchema = z.object({
  name: strengthLevelNameSchema,
  slug: updateStrengthLevelSlugSchema,
  sortOrder: strengthLevelSortOrderSchema,
});

/** Contact info rows (GET/POST /contact-info) */
export const CONTACT_INFO_TYPE_MIN = 1;
export const CONTACT_INFO_TYPE_MAX = 80;
export const CONTACT_INFO_TITLE_MIN = 1;
export const CONTACT_INFO_TITLE_MAX = 200;
export const CONTACT_INFO_VALUE_MIN = 1;
export const CONTACT_INFO_VALUE_MAX = 500;
export const CONTACT_INFO_SORT_MAX = 99_999;

const contactInfoTypeSchema = z
  .string()
  .trim()
  .min(CONTACT_INFO_TYPE_MIN, `Type is required`)
  .max(CONTACT_INFO_TYPE_MAX, `Type must be at most ${CONTACT_INFO_TYPE_MAX} characters`);

const contactInfoTitleSchema = z
  .string()
  .trim()
  .min(CONTACT_INFO_TITLE_MIN, `Title is required`)
  .max(CONTACT_INFO_TITLE_MAX, `Title must be at most ${CONTACT_INFO_TITLE_MAX} characters`);

const contactInfoValueSchema = z
  .string()
  .trim()
  .min(CONTACT_INFO_VALUE_MIN, `Value is required`)
  .max(CONTACT_INFO_VALUE_MAX, `Value must be at most ${CONTACT_INFO_VALUE_MAX} characters`);

const contactInfoSortOrderSchema = z.coerce
  .number()
  .int('Sort order must be a whole number')
  .min(0, 'Sort order must be at least 0')
  .max(CONTACT_INFO_SORT_MAX, `Sort order must be at most ${CONTACT_INFO_SORT_MAX}`);

export const createContactInfoFormSchema = z.object({
  type: contactInfoTypeSchema,
  title: contactInfoTitleSchema,
  value: contactInfoValueSchema,
  sortOrder: contactInfoSortOrderSchema,
});

export const updateContactInfoFormSchema = createContactInfoFormSchema;

/** Contact social links (GET/POST /contact-social-links) */
export const CONTACT_SOCIAL_PLATFORM_MIN = 1;
export const CONTACT_SOCIAL_PLATFORM_MAX = 80;
export const CONTACT_SOCIAL_URL_MAX = 2000;
export const CONTACT_SOCIAL_SORT_MAX = 99_999;

const contactSocialPlatformSchema = z
  .string()
  .trim()
  .min(CONTACT_SOCIAL_PLATFORM_MIN, `Platform is required`)
  .max(
    CONTACT_SOCIAL_PLATFORM_MAX,
    `Platform must be at most ${CONTACT_SOCIAL_PLATFORM_MAX} characters`,
  );

const contactSocialUrlSchema = z
  .string()
  .trim()
  .min(1, 'URL is required')
  .max(CONTACT_SOCIAL_URL_MAX, `URL must be at most ${CONTACT_SOCIAL_URL_MAX} characters`)
  .url('Enter a valid URL (e.g. https://example.com)');

const contactSocialSortOrderSchema = z.coerce
  .number()
  .int('Sort order must be a whole number')
  .min(0, 'Sort order must be at least 0')
  .max(CONTACT_SOCIAL_SORT_MAX, `Sort order must be at most ${CONTACT_SOCIAL_SORT_MAX}`);

export const createContactSocialLinkFormSchema = z.object({
  platform: contactSocialPlatformSchema,
  url: contactSocialUrlSchema,
  sortOrder: contactSocialSortOrderSchema,
  isActive: z.boolean(),
});

export const updateContactSocialLinkFormSchema = createContactSocialLinkFormSchema;

const flavorCreateSlugSchema = z
  .string()
  .trim()
  .min(STRENGTH_LEVEL_SLUG_MIN, `Slug must be at least ${STRENGTH_LEVEL_SLUG_MIN} characters`)
  .max(STRENGTH_LEVEL_SLUG_MAX, `Slug must be at most ${STRENGTH_LEVEL_SLUG_MAX} characters`)
  .regex(slugPattern, {
    message: 'Slug may only use lowercase letters, numbers, and underscores (e.g. mint_ice)',
  });

export const createFlavorFormSchema = z.object({
  name: strengthLevelNameSchema,
  slug: flavorCreateSlugSchema,
  isActive: z.boolean(),
  image: imageFile('Flavor image'),
});

export const updateFlavorFormSchema = z.object({
  name: strengthLevelNameSchema,
  slug: updateStrengthLevelSlugSchema,
  isActive: z.boolean(),
  image: imageFile('Flavor image').optional(),
});

/** Tax rate (POST/PATCH /tax-rates JSON) */
export const TAX_RATE_NAME_MAX = 120;
export const TAX_RATE_PERCENT_MAX = 100;

const taxRateNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(TAX_RATE_NAME_MAX, `Name must be at most ${TAX_RATE_NAME_MAX} characters`);

/** Empty string means no zone (optional `zone_id` on API). */
const taxRateZoneIdSchema = z.string().trim();

const taxRateRateSchema = z.coerce
  .number()
  .finite('Rate must be a valid number')
  .min(0, 'Rate cannot be negative')
  .max(TAX_RATE_PERCENT_MAX, `Rate must be at most ${TAX_RATE_PERCENT_MAX}`);

export const createTaxRateFormSchema = z.object({
  zoneId: taxRateZoneIdSchema,
  name: taxRateNameSchema,
  rate: taxRateRateSchema,
  isActive: z.boolean(),
});

export const updateTaxRateFormSchema = createTaxRateFormSchema;

const heroHeadlineSchema = z
  .string()
  .trim()
  .max(HERO_HEADLINE_MAX, `Headline must be at most ${HERO_HEADLINE_MAX} characters`);

const heroSubheadlineSchema = z
  .string()
  .trim()
  .max(HERO_SUBHEADLINE_MAX, `Subheadline must be at most ${HERO_SUBHEADLINE_MAX} characters`);

const heroPositionSchema = z.coerce
  .number()
  .finite()
  .int('Position must be a whole number')
  .min(0, 'Position must be 0 or greater')
  .max(HERO_POSITION_MAX, `Position must be at most ${HERO_POSITION_MAX}`);

const heroBannerBaseFields = {
  headline: heroHeadlineSchema,
  subheadline: heroSubheadlineSchema,
  position: heroPositionSchema,
  start_date: z.string(),
  end_date: z.string(),
  is_active: z.boolean(),
};

export const createHeroBannerFormSchema = z
  .object({
    ...heroBannerBaseFields,
    image: imageFile('Image file'),
  })
  .superRefine(refineHeroBannerDateOrder);

export const updateHeroBannerFormSchema = z
  .object({
    ...heroBannerBaseFields,
    image: z.preprocess(
      (v) => (v === null || v === undefined ? undefined : v),
      optionalHeroBannerImageFile(),
    ),
    existing_image_url: z.string(),
  })
  .superRefine(refineHeroBannerDateOrder)
  .superRefine(refineUpdateHeroBannerImage);

function optionalTestimonialImageFile() {
  const mb = DASHBOARD_IMAGE_MAX_BYTES / (1024 * 1024);
  return z
    .instanceof(File)
    .refine((f) => f.size > 0, { message: 'Image file is empty' })
    .refine((f) => f.size <= DASHBOARD_IMAGE_MAX_BYTES, {
      message: `Image must be ${mb} MB or smaller`,
    })
    .optional();
}

const testimonialNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(TESTIMONIAL_NAME_MAX, `Name must be at most ${TESTIMONIAL_NAME_MAX} characters`);

const testimonialRoleSchema = z
  .string()
  .trim()
  .min(1, 'Role is required')
  .max(TESTIMONIAL_ROLE_MAX, `Role must be at most ${TESTIMONIAL_ROLE_MAX} characters`);

const testimonialQuoteSchema = z
  .string()
  .trim()
  .min(1, 'Quote is required')
  .max(TESTIMONIAL_QUOTE_MAX, `Quote must be at most ${TESTIMONIAL_QUOTE_MAX} characters`);

const testimonialRatingSchema = z.coerce
  .number()
  .int('Rating must be a whole number')
  .min(1, 'Rating must be at least 1')
  .max(5, 'Rating must be at most 5');

const testimonialSortOrderSchema = z.coerce
  .number()
  .int('Sort order must be a whole number')
  .min(0, 'Sort order must be 0 or greater')
  .max(
    TESTIMONIAL_SORT_ORDER_MAX,
    `Sort order must be at most ${TESTIMONIAL_SORT_ORDER_MAX}`,
  );

function refineTestimonialImageSource(
  data: { image?: File | undefined; image_url: string },
  ctx: z.RefinementCtx,
) {
  const hasFile = data.image instanceof File && data.image.size > 0;
  const hasUrl = data.image_url.trim() !== '';
  if (hasFile && hasUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Use either an uploaded image or a URL, not both',
      path: ['image_url'],
    });
  }
}

export const createTestimonialFormSchema = z
  .object({
    name: testimonialNameSchema,
    role: testimonialRoleSchema,
    quote: testimonialQuoteSchema,
    rating: testimonialRatingSchema,
    sort_order: testimonialSortOrderSchema,
    is_active: z.boolean(),
    image: optionalTestimonialImageFile(),
    image_url: z.string().trim().optional().default(''),
  })
  .superRefine(refineTestimonialImageSource);

export const updateTestimonialFormSchema = z
  .object({
    name: testimonialNameSchema,
    role: testimonialRoleSchema,
    quote: testimonialQuoteSchema,
    rating: testimonialRatingSchema,
    sort_order: testimonialSortOrderSchema,
    is_active: z.boolean(),
    image: optionalTestimonialImageFile(),
    image_url: z.string().trim().optional().default(''),
  })
  .superRefine(refineTestimonialImageSource);

const productNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(PRODUCT_NAME_MAX, `Name must be at most ${PRODUCT_NAME_MAX} characters`);

const productDescriptionSchema = z
  .string()
  .trim()
  .max(PRODUCT_DESCRIPTION_MAX, `Description must be at most ${PRODUCT_DESCRIPTION_MAX} characters`);

const productManufacturerSchema = z
  .string()
  .trim()
  .max(
    PRODUCT_MANUFACTURER_MAX,
    `Manufacturer must be at most ${PRODUCT_MANUFACTURER_MAX} characters`,
  );

const productMetaTitleSchema = z
  .string()
  .trim()
  .max(PRODUCT_META_TITLE_MAX, `Meta title must be at most ${PRODUCT_META_TITLE_MAX} characters`);

const productMetaDescriptionSchema = z
  .string()
  .trim()
  .max(
    PRODUCT_META_DESCRIPTION_MAX,
    `Meta description must be at most ${PRODUCT_META_DESCRIPTION_MAX} characters`,
  );

const productHookSchema = z
  .string()
  .trim()
  .max(PRODUCT_HOOK_MAX, `Hook must be at most ${PRODUCT_HOOK_MAX} characters`);

export const createProductFormSchema = z.object({
  brand_id: z.coerce.number().int().positive('Select a brand'),
  flavor_id: z.coerce.number().int().positive('Select a flavor'),
  strength_id: z.coerce.number().int().positive('Select a strength level'),
  name: productNameSchema,
  slug: createBrandSlugSchema,
  nicotine_mg: z.coerce
    .number()
    .finite('Nicotine (mg) must be a valid number')
    .min(
      PRODUCT_NICOTINE_MG_MIN,
      `Nicotine (mg) must be at least ${PRODUCT_NICOTINE_MG_MIN}`,
    )
    .max(
      PRODUCT_NICOTINE_MG_MAX,
      `Nicotine (mg) must be at most ${PRODUCT_NICOTINE_MG_MAX} (database column limit)`,
    ),
  price: z.coerce.number().finite().min(0, 'Price must be 0 or greater'),
  compare_price: optionalNumberFromString(z.coerce.number().finite().min(0)),
  stock: z.coerce.number().int().min(0, 'Stock must be 0 or greater'),
  description: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    productDescriptionSchema.optional(),
  ),
  pouch_count: optionalNumberFromString(z.coerce.number().int().min(0)),
  weight_grams: optionalNumberFromString(z.coerce.number().finite().min(0)),
  manufacturer: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    productManufacturerSchema.optional(),
  ),
  meta_title: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    productMetaTitleSchema.optional(),
  ),
  meta_description: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    productMetaDescriptionSchema.optional(),
  ),
  hook: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    productHookSchema.optional(),
  ),
  is_active: z.boolean(),
  is_best_selling: z.boolean(),
  media: z.array(productMediaFile()).max(PRODUCT_MEDIA_MAX_FILES).optional().default([]),
  cover_image: optionalProductCoverImageFile(),
  cover_gif: optionalProductCoverGifFile(),
});

/** PATCH /products/:id — same rules as create */
export const updateProductFormSchema = createProductFormSchema;

const bundleLineSchema = z.object({
  productId: z
    .string()
    .trim()
    .min(1, 'Select a product')
    .transform((s) => Number(s))
    .refine((n) => Number.isInteger(n) && n > 0, { message: 'Select a product' }),
  quantity: z.coerce
    .number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(999, 'Quantity must be at most 999'),
});

/** POST /bundles — multipart; `products` is sent as JSON in FormData */
export const createBundleFormSchema = z.object({
  name: productNameSchema,
  slug: createBrandSlugSchema,
  description: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    productDescriptionSchema.optional(),
  ),
  price: z.coerce.number().finite().min(0, 'Price must be 0 or greater'),
  is_active: z.boolean(),
  image: productMediaFile().optional(),
  gallery_images: z
    .array(productMediaFile())
    .max(
      BUNDLE_GALLERY_MAX_FILES,
      `At most ${BUNDLE_GALLERY_MAX_FILES} gallery images`,
    )
    .optional()
    .default([]),
  product_lines: z.array(bundleLineSchema).min(1, 'Add at least one product'),
});

/** PATCH /bundles/:id — same multipart rules as create */
export const updateBundleFormSchema = createBundleFormSchema;

/** POST/PATCH /special-offers — multipart; same product rules as bundles plus optional schedule */
export const createSpecialOfferFormSchema = createBundleFormSchema.extend({
  start_date: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z.string().optional(),
  ),
  end_date: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z.string().optional(),
  ),
});

export const updateSpecialOfferFormSchema = createSpecialOfferFormSchema;

const createBlogCategorySlugSchema = z
  .string()
  .trim()
  .max(BLOG_CATEGORY_SLUG_MAX, `Slug must be at most ${BLOG_CATEGORY_SLUG_MAX} characters`)
  .superRefine((val, ctx) => {
    if (val.length === 0) return;
    if (val.length < BLOG_CATEGORY_SLUG_MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Slug must be at least ${BLOG_CATEGORY_SLUG_MIN} characters or left empty`,
        path: ['slug'],
      });
    } else if (!slugPattern.test(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Slug may only use lowercase letters, numbers, and underscores',
        path: ['slug'],
      });
    }
  });

export const createBlogCategoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(BLOG_CATEGORY_NAME_MIN, `Name must be at least ${BLOG_CATEGORY_NAME_MIN} character(s)`)
    .max(BLOG_CATEGORY_NAME_MAX, `Name must be at most ${BLOG_CATEGORY_NAME_MAX} characters`),
  slug: createBlogCategorySlugSchema,
  description: z
    .string()
    .trim()
    .max(
      BLOG_CATEGORY_DESCRIPTION_MAX,
      `Description must be at most ${BLOG_CATEGORY_DESCRIPTION_MAX} characters`,
    ),
});

const createFaqCategorySlugSchema = z
  .string()
  .trim()
  .max(FAQ_CATEGORY_SLUG_MAX, `Slug must be at most ${FAQ_CATEGORY_SLUG_MAX} characters`)
  .superRefine((val, ctx) => {
    if (val.length === 0) return;
    if (val.length < FAQ_CATEGORY_SLUG_MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Slug must be at least ${FAQ_CATEGORY_SLUG_MIN} characters or left empty`,
        path: ['slug'],
      });
    } else if (!slugPattern.test(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Slug may only use lowercase letters, numbers, and underscores',
        path: ['slug'],
      });
    }
  });

export const createFaqCategoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(FAQ_CATEGORY_NAME_MIN, `Name must be at least ${FAQ_CATEGORY_NAME_MIN} character(s)`)
    .max(FAQ_CATEGORY_NAME_MAX, `Name must be at most ${FAQ_CATEGORY_NAME_MAX} characters`),
  slug: createFaqCategorySlugSchema,
  description: z
    .string()
    .trim()
    .max(
      FAQ_CATEGORY_DESCRIPTION_MAX,
      `Description must be at most ${FAQ_CATEGORY_DESCRIPTION_MAX} characters`,
    ),
});

export const createFaqEntryFormSchema = z.object({
  question: z
    .string()
    .trim()
    .min(FAQ_ENTRY_QUESTION_MIN, `Question must be at least ${FAQ_ENTRY_QUESTION_MIN} character(s)`)
    .max(FAQ_ENTRY_QUESTION_MAX, `Question must be at most ${FAQ_ENTRY_QUESTION_MAX} characters`),
  answer: z
    .string()
    .trim()
    .min(FAQ_ENTRY_ANSWER_MIN, `Answer must be at least ${FAQ_ENTRY_ANSWER_MIN} character(s)`)
    .max(FAQ_ENTRY_ANSWER_MAX, `Answer must be at most ${FAQ_ENTRY_ANSWER_MAX} characters`),
  categoryId: z.string().trim().min(1, 'Select a category'),
  displayOrder: z.coerce
    .number()
    .int('Display order must be a whole number')
    .min(0, 'Display order must be 0 or greater')
    .max(FAQ_ENTRY_DISPLAY_ORDER_MAX, `Display order must be at most ${FAQ_ENTRY_DISPLAY_ORDER_MAX}`),
  isPublished: z.boolean(),
});

function optionalBlogPostSlugSchema() {
  return z
    .string()
    .trim()
    .max(BLOG_POST_SLUG_MAX, `Slug must be at most ${BLOG_POST_SLUG_MAX} characters`)
    .superRefine((val, ctx) => {
      if (val.length === 0) return;
      if (!slugPattern.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Slug may only use lowercase letters, numbers, and underscores',
          path: ['slug'],
        });
      }
    });
}

function optionalFeaturedImageFile() {
  const mb = DASHBOARD_IMAGE_MAX_BYTES / (1024 * 1024);
  return z
    .instanceof(File)
    .refine((f) => f.size > 0, { message: 'Image file is empty' })
    .refine((f) => f.size <= DASHBOARD_IMAGE_MAX_BYTES, {
      message: `Featured image must be ${mb} MB or smaller`,
    })
    .optional();
}

function optionalPageImageFile(label: string) {
  const mb = DASHBOARD_IMAGE_MAX_BYTES / (1024 * 1024);
  return z
    .instanceof(File)
    .refine((f) => f.size > 0, { message: `${label} file is empty` })
    .refine((f) => f.size <= DASHBOARD_IMAGE_MAX_BYTES, {
      message: `${label} must be ${mb} MB or smaller`,
    })
    .optional();
}

export const createBlogPostFormSchema = z
  .object({
    categoryId: z.string().trim().min(1, 'Choose a category'),
    title: z
      .string()
      .trim()
      .min(BLOG_POST_TITLE_MIN, `Title must be at least ${BLOG_POST_TITLE_MIN} character(s)`)
      .max(BLOG_POST_TITLE_MAX, `Title must be at most ${BLOG_POST_TITLE_MAX} characters`),
    slug: optionalBlogPostSlugSchema(),
    content: z
      .string()
      .max(BLOG_POST_CONTENT_MAX, `Content must be at most ${BLOG_POST_CONTENT_MAX} characters`)
      .optional()
      .default(''),
    author: z
      .string()
      .trim()
      .max(BLOG_POST_AUTHOR_MAX, `Author must be at most ${BLOG_POST_AUTHOR_MAX} characters`)
      .optional()
      .default(''),
    publishedAt: z.string().optional().default(''),
    isPublished: z.boolean(),
    metaTitle: z
      .string()
      .trim()
      .max(BLOG_POST_META_TITLE_MAX, `Meta title must be at most ${BLOG_POST_META_TITLE_MAX} characters`)
      .optional()
      .default(''),
    metaDescription: z
      .string()
      .trim()
      .max(
        BLOG_POST_META_DESC_MAX,
        `Meta description must be at most ${BLOG_POST_META_DESC_MAX} characters`,
      )
      .optional()
      .default(''),
    featuredImageAlt: z
      .string()
      .trim()
      .max(
        BLOG_POST_FEATURED_IMAGE_ALT_MAX,
        `Featured image alt must be at most ${BLOG_POST_FEATURED_IMAGE_ALT_MAX} characters`,
      )
      .optional()
      .default(''),
    featured_image: optionalFeaturedImageFile(),
    featuredImageUrl: z.string().trim().optional().default(''),
  })
  .superRefine((data, ctx) => {
    const hasFile = data.featured_image instanceof File && data.featured_image.size > 0;
    const hasUrl = data.featuredImageUrl.trim() !== '';
    if (hasFile && hasUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Use either an uploaded image or a URL, not both',
        path: ['featuredImageUrl'],
      });
    }
  });

const pageTitleSchema = z
  .string()
  .trim()
  .min(PAGE_TITLE_MIN, `Title must be at least ${PAGE_TITLE_MIN} character(s)`)
  .max(PAGE_TITLE_MAX, `Title must be at most ${PAGE_TITLE_MAX} characters`);

const pageSlugSchema = z
  .string()
  .trim()
  .max(PAGE_SLUG_MAX, `Slug must be at most ${PAGE_SLUG_MAX} characters`)
  .superRefine((val, ctx) => {
    if (val.length === 0) return;
    if (val.length < PAGE_SLUG_MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Slug must be at least ${PAGE_SLUG_MIN} characters or left empty`,
        path: ['slug'],
      });
      return;
    }
    if (!slugPattern.test(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Slug may only use lowercase letters, numbers, and underscores',
        path: ['slug'],
      });
    }
  });

const pageContentSchema = z
  .string()
  .max(PAGE_CONTENT_MAX, `Content must be at most ${PAGE_CONTENT_MAX} characters`)
  .optional()
  .default('');

function refinePageImageSource(
  data: {
    image_1?: File | undefined;
    image_2?: File | undefined;
    image_url_1: string;
    image_url_2: string;
  },
  ctx: z.RefinementCtx,
) {
  const hasFile1 = data.image_1 instanceof File && data.image_1.size > 0;
  const hasUrl1 = data.image_url_1.trim() !== '';
  if (hasFile1 && hasUrl1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Use either image 1 upload or image URL 1, not both',
      path: ['image_url_1'],
    });
  }

  const hasFile2 = data.image_2 instanceof File && data.image_2.size > 0;
  const hasUrl2 = data.image_url_2.trim() !== '';
  if (hasFile2 && hasUrl2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Use either image 2 upload or image URL 2, not both',
      path: ['image_url_2'],
    });
  }
}

const pageMetaTitleFieldSchema = z
  .string()
  .trim()
  .max(
    BLOG_POST_META_TITLE_MAX,
    `Meta title must be at most ${BLOG_POST_META_TITLE_MAX} characters`,
  );

const pageMetaDescriptionFieldSchema = z
  .string()
  .trim()
  .max(
    BLOG_POST_META_DESC_MAX,
    `Meta description must be at most ${BLOG_POST_META_DESC_MAX} characters`,
  );

export const createPageFormSchema = z
  .object({
    title: pageTitleSchema,
    slug: pageSlugSchema,
    content: pageContentSchema,
    meta_title: z.preprocess(
      (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
      pageMetaTitleFieldSchema.optional(),
    ),
    meta_description: z.preprocess(
      (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
      pageMetaDescriptionFieldSchema.optional(),
    ),
    image_url_1: z.string().trim().optional().default(''),
    image_url_2: z.string().trim().optional().default(''),
    image_1: optionalPageImageFile('Image 1'),
    image_2: optionalPageImageFile('Image 2'),
  })
  .superRefine(refinePageImageSource);

export const updatePageFormSchema = createPageFormSchema;

const pointOfSaleTextSchema = z
  .string()
  .trim()
  .min(1, 'This field is required')
  .max(POINT_OF_SALE_TEXT_MAX, `Must be at most ${POINT_OF_SALE_TEXT_MAX} characters`);

const pointOfSaleLatSchema = z.coerce
  .number()
  .finite('Latitude must be a valid number')
  .min(POINT_OF_SALE_COORD_MIN, `Latitude must be at least ${POINT_OF_SALE_COORD_MIN}`)
  .max(POINT_OF_SALE_COORD_MAX, `Latitude must be at most ${POINT_OF_SALE_COORD_MAX}`);

const pointOfSaleLngSchema = z.coerce
  .number()
  .finite('Longitude must be a valid number')
  .min(POINT_OF_SALE_LONG_MIN, `Longitude must be at least ${POINT_OF_SALE_LONG_MIN}`)
  .max(POINT_OF_SALE_LONG_MAX, `Longitude must be at most ${POINT_OF_SALE_LONG_MAX}`);

const pointOfSaleEmailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Enter a valid email address')
  .max(POINT_OF_SALE_TEXT_MAX, `Email must be at most ${POINT_OF_SALE_TEXT_MAX} characters`);

const pointOfSaleMapUrlSchema = z
  .string()
  .trim()
  .min(1, 'Map embedded URL is required')
  .url('Enter a valid URL')
  .max(POINT_OF_SALE_DESCRIPTION_MAX, `Must be at most ${POINT_OF_SALE_DESCRIPTION_MAX} characters`);

export const createPointOfSaleFormSchema = z.object({
  title: pointOfSaleTextSchema,
  slug: createBrandSlugSchema,
  lat: pointOfSaleLatSchema,
  lng: pointOfSaleLngSchema,
  phone: pointOfSaleTextSchema,
  email: pointOfSaleEmailSchema,
  map_embedded_url: pointOfSaleMapUrlSchema,
  is_active: z.boolean(),
  meta_title: pointOfSaleTextSchema,
  meta_description: z
    .string()
    .trim()
    .min(1, 'Meta description is required')
    .max(
      POINT_OF_SALE_META_DESCRIPTION_MAX,
      `Meta description must be at most ${POINT_OF_SALE_META_DESCRIPTION_MAX} characters`,
    ),
  zone_id: z.coerce.number().int().positive('Zone ID must be greater than 0'),
  short_description: z
    .string()
    .trim()
    .min(1, 'Short description is required')
    .max(
      POINT_OF_SALE_DESCRIPTION_MAX,
      `Short description must be at most ${POINT_OF_SALE_DESCRIPTION_MAX} characters`,
    ),
  full_address: z
    .string()
    .trim()
    .min(1, 'Full address is required')
    .max(
      POINT_OF_SALE_DESCRIPTION_MAX,
      `Full address must be at most ${POINT_OF_SALE_DESCRIPTION_MAX} characters`,
    ),
  phone_secondary: pointOfSaleTextSchema,
  image: imageFile('Image file'),
});

export const updatePointOfSaleFormSchema = createPointOfSaleFormSchema.extend({
  image: imageFile('Image file').optional(),
});

export function formatZodError(error: z.ZodError): string {
  const first = error.issues[0]?.message;
  if (first) return first;
  return 'Validation failed.';
}

/** First message per top-level field for inline UI (Zod 4 `flatten`). */
export function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const flat = error.flatten();
  const out: Record<string, string> = {};
  for (const key of Object.keys(flat.fieldErrors)) {
    const msgs = flat.fieldErrors[key as keyof typeof flat.fieldErrors];
    if (Array.isArray(msgs) && typeof msgs[0] === 'string') {
      out[key] = msgs[0];
    }
  }
  return out;
}

/** First message per field path for nested arrays (e.g. `product_lines.0.productId`). */
export function fieldErrorsFromZodPaths(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.');
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

/** Build a URL slug from a title or name (lowercase, words joined with `_`). */
export function generateSlugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/** Use manual slug when provided; otherwise derive from `nameSource`. */
export function resolveOptionalSlug(manualSlug: string, nameSource: string): string {
  const trimmed = manualSlug.trim();
  if (trimmed) return normalizeBrandSlugInput(trimmed);
  return generateSlugFromName(nameSource);
}

/** Lowercase, allow only a-z, 0-9, underscores; collapse repeated underscores (slug inputs). */
export function normalizeBrandSlugInput(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}
