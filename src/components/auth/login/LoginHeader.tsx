'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function LoginHeader() {
  return (
    <div className="mb-14">
      <nav className="mb-16 flex items-center gap-3 text-[15px] text-[#9c97b2]">
        <Link href="/" className="transition hover:text-bold">
          Home
        </Link>
        <ChevronRight size={16} />
        <span className="text-bold u">Login</span>
      </nav>

      <div className="mx-auto max-w-[780px] text-center">
        <h1 className="text-[44px] font-bold uppercase leading-none tracking-[-0.04em] text-bold md:text-[68px]">
          Login
        </h1>

        <p className="mx-auto mt-6 max-w-[650px] text-[17px] leading-7 text-bold/45">
          Login to your <strong>VikingTin.ae</strong> account to manage your{' '}
          <strong>orders</strong>, track <strong>shipments</strong>, and access{' '}
          <strong>exclusive member deals</strong>. Secure and fast access to
          your personalized dashboard.
        </p>
      </div>
    </div>
  );
}