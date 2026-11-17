'use client';

import { Mail, MapPinned, Phone } from 'lucide-react';
import type { ContactInfoItem as ContactInfoItemType } from '@/types/contact';

// Grouped version of the item (multiple lines per type)
type GroupedContactItem = {
  id: string;        // can be `${type}-group`
  type: string;
  title: string;
  lines: string[];   // array of values (e.g., ['+961 81 685 128', '+961 70 123 456'])
};

type ContactInfoItemProps = {
  item: GroupedContactItem;
};

function getIcon(type: string) {
  const normalized = type.toLowerCase();
  switch (normalized) {
    case 'address':
    case 'location':
      return <MapPinned className="h-6 w-6 text-white" strokeWidth={2} />;
    case 'phone':
    case 'mobile':
    case 'telephone':
      return <Phone className="h-6 w-6 text-white" strokeWidth={2} />;
    case 'email':
    case 'mail':
      return <Mail className="h-6 w-6 text-white" strokeWidth={2} />;
    default:
      return <MapPinned className="h-6 w-6 text-white" strokeWidth={2} />;
  }
}

export default function ContactInfoItem({ item }: ContactInfoItemProps) {
  return (
    <div className="flex gap-5">
      <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-black">
        {getIcon(item.type)}
      </div>

      <div>
        <h3 className="text-[26px] font-bold uppercase leading-none text-black md:text-[18px]">
          {item.title}
        </h3>

        <div className="mt-4 space-y-1">
          {item.lines.map((line, idx) => (
            <p
              key={idx}
              className="text-[16px] leading-5 text-black/45 md:text-[14px] md:leading-5"
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}