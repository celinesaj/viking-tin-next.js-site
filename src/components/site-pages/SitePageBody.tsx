'use client';

import { sanitizeHtml } from '@/lib/sanitize';

type SitePageBodyProps = {
  content: string;
};

export default function SitePageBody({ content }: SitePageBodyProps) {
  // 🛡️ Sanitize the HTML content to remove any malicious scripts or attributes
  const safeContent = sanitizeHtml(content);

  return (
    <section className="pt-14 md:pt-20">
      <div
        className="
          site-page-content
          text-black/80
          [&_section]:mb-16
          [&_.content-grid]:grid
          [&_.content-grid]:gap-10
          lg:[&_.content-grid]:grid-cols-[1fr_460px]
          [&_h2]:mb-6
          [&_h2]:text-[44px]
          [&_h2]:font-semibold
          [&_h2]:uppercase
          [&_h2]:leading-[0.95]
          [&_h2]:tracking-[-0.04em]
          [&_h2]:text-black
          [&_h3]:mb-6
          [&_h3]:text-[28px]
          [&_h3]:font-semibold
          [&_h3]:uppercase
          [&_h3]:leading-none
          [&_h3]:text-black
          md:[&_h3]:text-[40px]
          [&_h4]:mb-4
          [&_h4]:mt-8
          [&_h4]:text-[18px]
          [&_h4]:font-semibold
          [&_h4]:text-black/60
          md:[&_h4]:text-[26px]
          [&_p]:mb-4
          [&_p]:text-[16px]
          [&_p]:leading-8
          [&_ol]:mb-6
          [&_ol]:ml-5
          [&_ol]:list-decimal
          [&_ol]:space-y-2
          [&_ul]:mb-6
          [&_ul]:ml-5
          [&_ul]:list-disc
          [&_ul]:space-y-2
          [&_li]:text-[16px]
          [&_li]:leading-8
          [&_img]:w-full
          [&_img]:rounded-[28px]
          [&_img]:object-cover
          [&_img]:shadow-[0_10px_24px_rgba(0,0,0,0.08)]
        "
        dangerouslySetInnerHTML={{ __html: safeContent }}
      />
    </section>
  );
}