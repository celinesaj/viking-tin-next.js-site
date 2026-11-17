import type { FaqItem } from '@/types/faq';
import FaqAccordionItem from './FaqAccordionItem';

type FaqCategorySectionProps = {
  title: string;
  items: FaqItem[];
};

export default function FaqCategorySection({
  title,
  items,
}: FaqCategorySectionProps) {
  if (!items.length) return null;

  return (
    <section className="grid gap-6 lg:grid-cols-[160px_minmax(0,1fr)] lg:gap-12">
      <div>
        <h2 className="text-[32px] font-bold tracking-[-0.03em] text-black md:text-[40px] lg:text-[44px]">
          {title}
        </h2>
        <div className="mt-2 h-[3px] w-full max-w-[150px] bg-black" />
      </div>

      <div>
        {items.map((item, index) => (
          <div key={item.id}
          className={index === 0 ? '' : 'border-t-1 border-black'}
          >
            <FaqAccordionItem item={item} />
            {index === items.length - 1 && <div className="border-t-1 border-black" />}
          </div>
        ))}
      </div>
    </section>
  );
}