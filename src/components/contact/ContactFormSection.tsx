'use client';

import Image from 'next/image';
import type { ContactFormData } from '@/types/contact';
import ContactForm from './ContactForm';

type ContactFormSectionProps = {
  form: ContactFormData;
};

export default function ContactFormSection({
  form,
}: ContactFormSectionProps) {
  return (
    <section className="relative mt-14 md:mt-20">
      
      {/* FULL WIDTH BACKGROUND */}
      <div className="absolute inset-0 bg-white/40" />
      <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden  px-5 py-12 md:px-10 md:py-16">
        
        <Image
          src={form.backgroundImage}
          alt={form.title}
          fill
          className="object-cover opacity-80"
        />

        {/* CONTENT WRAPPER (centered) */}
        <div className="relative z-10 mx-auto max-w-[1220px]">
          <h2 className="text-center text-[42px] font-semibold uppercase leading-none tracking-[-0.04em] text-bold md:text-[60px]">
           Contact Us
          </h2>

          <div className="mt-10">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}