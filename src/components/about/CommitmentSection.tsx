'use client';

import { IMAGES } from '@/constants/images';

export default function CommitmentSection() {
  return (
    <section className="w-full py-2 sm:py-8 md:py-2 xl:py-2">
      <div className="mx-auto max-w-7xl grid grid-cols-1 items-center gap-6 px-6 sm:px-10 md:px-14 lg:grid-cols-2 lg:gap-8 xl:px-20">
        {/* LEFT — image */}
        <div className="overflow-hidden rounded-2xl">
          <img
            src={IMAGES.seo.commitment}
            alt="Viking Tin nicotine pouches commitment"
            className="h-[280px] w-full object-cover object-center sm:h-[340px] md:h-[400px] lg:h-[420px]"
          />
        </div>

        {/* RIGHT — text */}
        <div>
          <h2 className="text-[36px] font-bold uppercase tracking-[-0.02em] text-black leading-[1.1] sm:text-[48px] md:text-[56px] xl:text-[64px]">
            Our<br />Commitment
          </h2>

          <p className="mt-4 text-[13px] leading-[1.7] text-black/60 sm:text-[14px] md:text-[15px] xl:text-[16px]">
            At Viking Tin, we are committed to providing a secure and responsible
            platform for adult users. We ensure that all our products meet the
            highest industry standards for a confident and discreet experience.
          </p>
        </div>
      </div>
    </section>
  );
}