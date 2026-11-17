'use client';

import Container from '@/components/common/Container';
import { aboutPageData } from '@/mock/about';
import AboutHeroBanner from './AboutHeroBanner';
import AboutQuoteSection from './AboutQuoteSection';
import AboutStorySection from './AboutStorySection';
import AboutValuesSection from './AboutValuesSection';
import CommitmentSection from './CommitmentSection';

export default function AboutPageContent() {
  return (
    <main className="relative overflow-x-hidden pb-0 pt-10 md:pt-14">
 

      <style jsx global>{`
        @keyframes faqSpinLeft {
          0% { transform: rotate(0deg) translateY(0px); }
          50% { transform: rotate(180deg) translateY(-8px); }
          100% { transform: rotate(360deg) translateY(0px); }
        }
        @keyframes faqSpinRight {
          0% { transform: rotate(0deg) translateY(0px); }
          50% { transform: rotate(-180deg) translateY(8px); }
          100% { transform: rotate(-360deg) translateY(0px); }
        }
        .faq-anim-left { animation: faqSpinLeft 28s linear infinite; will-change: transform; }
        .faq-anim-right { animation: faqSpinRight 34s linear infinite; will-change: transform; }
      `}</style>

      <Container>
             <img
  src="/images/faq/sides.png"
  alt=""
  aria-hidden="true"
  className="pointer-events-none absolute top-[32%] left-[-110px] hidden w-[160px] lg:block xl:left-[-70px] xl:w-[220px] faq-anim-left"
/>

      <img
        src="/images/faq/sides.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-[-110px] top-[28%] hidden w-[160px] lg:block xl:right-[-70px] xl:w-[220px] faq-anim-right"
      />
        <div className="mx-auto max-w-[1220px]">
          <AboutHeroBanner hero={aboutPageData.hero} />
          <AboutQuoteSection quote={aboutPageData.quote} />
          <AboutStorySection story={aboutPageData.story} />
          <AboutValuesSection values={aboutPageData.values} />
        </div>
      </Container>

      <CommitmentSection />

    </main>
  );
}