'use client';

import Link from 'next/link';
import type {
  ContactInfoItem as ContactInfoItemType,
  ContactMap,
  ContactSocialLink,
} from '@/types/contact';
import ContactInfoItem from './ContactInfoItem';
import ContactMapCard from './ContactMapCard';
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
  FaTiktok,
  FaYoutube,
  FaPinterestP,
  FaSnapchat,
  FaGlobe,
} from 'react-icons/fa6';

type ContactInfoSectionProps = {
  infoItems: ContactInfoItemType[];
  socialLinks: ContactSocialLink[];
  map: ContactMap;
};

function getSocialIcon(platform: string) {
  const normalized = platform.toLowerCase();

  switch (normalized) {
    case 'facebook':
      return <FaFacebookF className="h-5 w-5 text-white" />;

    case 'instagram':
      return <FaInstagram className="h-5 w-5 text-white" />;

    case 'linkedin':
      return <FaLinkedinIn className="h-5 w-5 text-white" />;

    case 'x':
    case 'twitter':
      return <FaXTwitter className="h-5 w-5 text-white" />;

    case 'tiktok':
      return <FaTiktok className="h-5 w-5 text-white" />;

    case 'youtube':
      return <FaYoutube className="h-5 w-5 text-white" />;

    case 'pinterest':
      return <FaPinterestP className="h-5 w-5 text-white" />;

    case 'snapchat':
      return <FaSnapchat className="h-5 w-5 text-white" />;

    default:
      return <FaGlobe className="h-5 w-5 text-white" />;
  }
}

export default function ContactInfoSection({
  infoItems,
  socialLinks,
  map,
}: ContactInfoSectionProps) {
  return (
    <section className="py-4 md:py-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_520px] lg:gap-14">
        <div>
          <div className="space-y-10">
            {infoItems.map((item) => (
              <ContactInfoItem key={item.id} item={item} />
            ))}
          </div>

         {socialLinks && socialLinks.length > 0 && (
  <div className="mt-10">
    <h3 className="text-[18px] font-semibold uppercase leading-none text-bold md:text-[18px]">
      Social Media
    </h3>

    <div className="mt-6 flex items-center gap-4">
      {socialLinks.map((link) => (
        <Link
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-black transition hover:opacity-90"
          aria-label={link.platform}
        >
          {getSocialIcon(link.platform)}
        </Link>
      ))}
    </div>
  </div>
)}
        </div>

        <div>
          <ContactMapCard embedUrl={map.embedUrl} title={map.pinLabel} />
        </div>
      </div>
    </section>
  );
}