'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function CreateAccountHeader() {
  return (
    <div className="mb-14">
      <nav className="mb-16 flex items-center gap-3 text-[15px] text-[#9c97b2]">
        <Link href="/" className="transition hover:text-bold">
          Home
        </Link>
        <ChevronRight size={16} />
        <span className="text-bold">Create an Account</span>
      </nav>

      <div className="mx-auto max-w-[780px] text-center">
        <h1 className="text-[44px] font-bold uppercase leading-none tracking-[-0.04em] text-bold md:text-[68px]">
          Create an Account
        </h1>

        <p className="mx-auto mt-6 max-w-[650px] text-[17px] leading-7 text-bold/45">
          Join <strong>VikingTin.ae</strong> today to unlock <strong>exclusive discounts</strong>,{' '}
          <strong>fast checkout</strong>, and <strong>personalized recommendations</strong>. Get
          updates on <strong>new arrivals</strong> and <strong>special offers</strong> tailored just
          for you.
        </p>
      </div>
    </div>
  );
}