'use client';

import { MapPin } from 'lucide-react';

type ContactMapCardProps = {
  embedUrl: string;
  title?: string;
};

export default function ContactMapCard({
  embedUrl,
  title = 'Our Location',
}: ContactMapCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[36px] shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
      <div className="relative h-[420px] w-full md:h-[485px]">
        <iframe
          src={embedUrl}
          title={title}
          className="h-full w-full border-0 "
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>

      {/* <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-[92px] w-[92px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
        <MapPin className="h-10 w-10 text-bold" strokeWidth={2.5} />
      </div> */}
    </div>
  );
}