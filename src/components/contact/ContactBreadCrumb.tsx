'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

type ContactBreadcrumbProps = {
  label: string;
};

export default function ContactBreadcrumb({
  label,
}: ContactBreadcrumbProps) {
  return (
    <nav className="mb-10 mt-8 flex items-center gap-3 text-[15px] text-[#9c97b2]">
      <Link href="/" className="transition hover:text-bold">
        Home
      </Link>
      <ChevronRight size={16} />
      <span className="text-bold">{label}</span>
    </nav>
  );
}