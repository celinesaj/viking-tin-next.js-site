'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import type { FaqItem } from '@/types/faq';

type FaqAccordionItemProps = {
  item: FaqItem;
};

export default function FaqAccordionItem({ item }: FaqAccordionItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-[16px] font-medium leading-[1.3] text-black md:text-[18px]">
          {item.question}
        </span>

        <span className="shrink-0 text-black">
          {open ? <Minus size={20} strokeWidth={2.5} /> : <Plus size={20} strokeWidth={2.5} />}
        </span>
      </button>

      {open && (
        <div className="pb-5 pr-8 text-[14px] font-regular leading-7 text-black/70 md:text-[15px]">
          {item.answer}
        </div>
      )}
    </div>
  );
}