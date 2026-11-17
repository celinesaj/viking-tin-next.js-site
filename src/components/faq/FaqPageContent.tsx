'use client';

import { useMemo } from 'react';
import { useGetFaqQuery } from '@/features/faq/faqApi';
import FaqCategorySection from './FaqCategorySection';
import type { FaqItem } from '@/types/faq';

const CATEGORY_ORDER = ['Shipping', 'Returns', 'Sizing', 'Payment'];

export default function FaqPageContent() {
  const { data, isLoading, isError } = useGetFaqQuery({
    page: 1,
    limit: 20,
    is_published: true,
  });

  const publishedFaqs = useMemo(() => {
    const items = (data?.data ?? []).filter((item) => item.isPublished);

    return [...items].sort((a, b) => {
      const aCategory = itemCategory(a);
      const bCategory = itemCategory(b);

      const aIndex = CATEGORY_ORDER.indexOf(aCategory);
      const bIndex = CATEGORY_ORDER.indexOf(bCategory);

      const normalizedAIndex =
        aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
      const normalizedBIndex =
        bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;

      if (normalizedAIndex !== normalizedBIndex) {
        return normalizedAIndex - normalizedBIndex;
      }

      return a.displayOrder - b.displayOrder;
    });
  }, [data]);

  const groupedFaqs = useMemo(() => {
    const categoryMap = new Map<string, FaqItem[]>();

    for (const item of publishedFaqs) {
      const categoryName = itemCategory(item);
      if (!categoryName) continue;

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, []);
      }

      categoryMap.get(categoryName)!.push(item);
    }

    const orderedCategories = CATEGORY_ORDER
      .map((category) => ({
        category,
        items: categoryMap.get(category) ?? [],
      }))
      .filter((group) => group.items.length > 0);

    const extraCategories = [...categoryMap.entries()]
      .filter(([category]) => !CATEGORY_ORDER.includes(category))
      .map(([category, items]) => ({
        category,
        items,
      }));

    return [...orderedCategories, ...extraCategories];
  }, [publishedFaqs]);

  return (
    <main className="relative overflow-hidden">

      <img
        src="/images/faq/sides.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[32%] left-[-110px] hidden w-[160px] lg:block xl:left-[-70px] xl:w-[220px] faq-anim-left"
      />

      <img
        src="/images/faq/sides.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-[-110px] top-[28%] hidden w-[160px] lg:block xl:right-[-70px] xl:w-[220px] faq-anim-right"
      />

      {/* ANIMATION */}
      <style jsx global>{`
        @keyframes faqSpinLeft {
          0% {
            transform: rotate(0deg) translateY(0px);
          }
          50% {
            transform: rotate(180deg) translateY(-8px);
          }
          100% {
            transform: rotate(360deg) translateY(0px);
          }
        }

        @keyframes faqSpinRight {
          0% {
            transform: rotate(0deg) translateY(0px);
          }
          50% {
            transform: rotate(-180deg) translateY(8px);
          }
          100% {
            transform: rotate(-360deg) translateY(0px);
          }
        }

        .faq-anim-left {
          animation: faqSpinLeft 28s linear infinite;
          will-change: transform;
        }

        .faq-anim-right {
          animation: faqSpinRight 34s linear infinite;
          will-change: transform;
        }
      `}</style>

      <section className="mx-auto max-w-[1440px] px-4 pb-16 pt-10 md:px-6 md:pb-20 lg:px-10 lg:pt-12">

        {/* HERO BANNER */}
        <div
          className="overflow-hidden rounded-[28px] md:rounded-[38px]"
          style={{
            backgroundImage: "url('/images/faq/faq.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* IMPORTANT FIX: DO NOT HIDE THIS CONTAINER */}
          <div className="grid min-h-[220px] items-center gap-8 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-[1fr_420px] lg:px-16">

            {/* TEXT → hidden only on mobile */}
            <div className="hidden max-w-[480px] md:block">
              <h1 className="text-[44px] font-bold tracking-[-0.04em] uppercase text-black md:text-[64px]">
                FAQ
              </h1>
              <p className="mt-3 max-w-[420px] text-[14px] leading-6 text-black/70 md:text-[15px]">
                Find quick answers about shipping, returns, sizing, and payment in one place.
              </p>
            </div>

            <div className="flex justify-center lg:justify-end" />
          </div>
        </div>

        {/* FAQ CONTENT */}
        <div className="mt-12 md:mt-16">
          {isLoading ? (
            <FaqLoadingState />
          ) : isError ? (
            <FaqErrorState />
          ) : groupedFaqs.length > 0 ? (
            <div className="space-y-14 md:space-y-20">
              {groupedFaqs.map(({ category, items }) => (
                <FaqCategorySection
                  key={category}
                  title={category}
                  items={items}
                />
              ))}
            </div>
          ) : (
            <FaqEmptyState />
          )}
        </div>
      </section>
    </main>
  );
}

function itemCategory(item: FaqItem) {
  return item.category?.name ?? '';
}

/* STATES (unchanged) */

function FaqLoadingState() {
  return (
    <div className="space-y-14 md:space-y-20">
      {Array.from({ length: 2 }).map((_, sectionIndex) => (
        <section
          key={sectionIndex}
          className="grid gap-6 lg:grid-cols-[160px_minmax(0,1fr)] lg:gap-12"
        >
          <div>
            <div className="h-10 w-32 animate-pulse rounded bg-black/10 md:h-12" />
            <div className="mt-2 h-[3px] w-full max-w-[150px] bg-black/20" />
          </div>

          <div>
            {Array.from({ length: 3 }).map((__, itemIndex) => (
              <div key={itemIndex} className="border-t-2 border-black py-4">
                <div className="h-6 w-full animate-pulse rounded bg-black/10" />
              </div>
            ))}
            <div className="border-t-2 border-black" />
          </div>
        </section>
      ))}
    </div>
  );
}

function FaqErrorState() {
  return (
    <div className="rounded-[24px] border border-black/10 px-6 py-8 text-center">
      <p className="text-[16px] font-medium text-black">
        Failed to load FAQs.
      </p>
      <p className="mt-2 text-[14px] text-black/70">
        Please try again later.
      </p>
    </div>
  );
}

function FaqEmptyState() {
  return (
    <div className="rounded-[24px] border border-black/10 px-6 py-8 text-center">
      <p className="text-[16px] font-medium text-black">
        No FAQs available right now.
      </p>
    </div>
  );
}