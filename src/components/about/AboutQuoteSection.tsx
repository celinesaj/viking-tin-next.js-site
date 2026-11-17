'use client';

import type { AboutQuote } from '@/types/about';

type AboutQuoteSectionProps = {
  quote: AboutQuote;
};

export default function AboutQuoteSection({
  quote,
}: AboutQuoteSectionProps) {
  return (
    <section className="py-12 md:py-20">
      <div className="flex items-center justify-center gap-3 text-center md:gap-6">
        <span className="text-[70px] font-bold leading-none text-bold/35 md:text-[120px]">
          “
        </span>

        <h2 className="text-[28px] uppercase leading-none tracking-[-0.03em] text-bold md:text-[45px]">
          <span className="font-light">{quote.first} </span>
          <span className="font-semibold">{quote.highlighted}</span>
        </h2>

        <span className="text-[70px] font-bold leading-none text-bold/35 md:text-[120px]">
          ”
        </span>
      </div>
    </section>
  );
}