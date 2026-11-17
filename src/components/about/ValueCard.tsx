'use client';

import { Eye, Gem, Goal } from 'lucide-react';
import type { AboutValueItem } from '@/types/about';

type ValueCardProps = {
  item: AboutValueItem;
};

function getIcon(icon: AboutValueItem['icon']) {
  switch (icon) {
    case 'vision':
      return <Eye className="h-12 w-12" strokeWidth={2} />;
    case 'mission':
      return <Goal className="h-12 w-12" strokeWidth={2} />;
    case 'core-value':
      return <Gem className="h-12 w-12" strokeWidth={2} />;
    default:
      return <Eye className="h-12 w-12" strokeWidth={2} />;
  }
}

export default function ValueCard({ item }: ValueCardProps) {
  return (
    <article className="px-4 py-8 text-center md:px-8 md:py-10">
      <div className="flex justify-center text-bold">{getIcon(item.icon)}</div>

      <h3 className="mt-5 text-[28px] font-bold text-bold md:text-[38px]">
        {item.title}
      </h3>

      <p className="mx-auto mt-4 max-w-[320px] text-[14px] leading-6 text-bold/40 md:text-[16px] md:leading-7">
        {item.description}
      </p>
    </article>
  );
}