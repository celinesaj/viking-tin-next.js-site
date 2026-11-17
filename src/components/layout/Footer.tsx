'use client';

import Link from 'next/link';
import { Mail, MapPinned, Phone } from 'lucide-react';
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
import { COLORS } from '@/constants/colors';
import { IMAGES } from '@/constants/images';
import { useGetSitePagesQuery } from '@/features/site-pages/sitePagesApi';
import {
  useGetContactInfoQuery,
  useGetContactSocialLinksQuery,
} from '@/features/contact/contactApi';
import type { ContactInfoItem, ContactSocialLink } from '@/types/contact';

const navigationLinks = [
  { label: 'Home', href: '/' },
  { label: 'Our Store', href: '/store' },
  { label: 'Our Brands', href: '/store' },
  { label: 'Special Offers', href: '/specialOffers' },
  { label: 'Point of Store', href: '/point-of-sale' },
  { label: 'Blogs', href: '/blogs' },
  { label: 'About us', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Account', href: '/account' },
];

const staticLinks = [{ label: 'FAQ', href: '/faq' }];

function normalizeValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '');
}

/**
 * Group contact info items by type (phone, email, address)
 * Returns an object with keys: 'phone', 'email', 'address'
 */
function groupContactInfo(items: ContactInfoItem[]): Record<string, ContactInfoItem | null> {
  const grouped: Record<string, ContactInfoItem | null> = {
    phone: null,
    email: null,
    address: null,
  };
  for (const item of items) {
    const type = normalizeValue(item.type);
    if (type === 'phone' && !grouped.phone) grouped.phone = item;
    else if (type === 'email' && !grouped.email) grouped.email = item;
    else if (type === 'address' && !grouped.address) grouped.address = item;
  }
  return grouped;
}

function getSocialIcon(platform: string) {
  const key = normalizeValue(platform);
  switch (key) {
    case 'facebook':
      return FaFacebookF;
    case 'instagram':
      return FaInstagram;
    case 'linkedin':
    case 'linkedinin':
      return FaLinkedinIn;
    case 'twitter':
    case 'x':
    case 'xtwitter':
      return FaXTwitter;
    case 'tiktok':
      return FaTiktok;
    case 'youtube':
      return FaYoutube;
    case 'pinterest':
      return FaPinterestP;
    case 'snapchat':
      return FaSnapchat;
    default:
      return FaGlobe;
  }
}

function sortSocialLinks(items: ContactSocialLink[]) {
  return [...items];
}

// Footer-specific info row component (matches contact page style but smaller/dark)
function FooterInfoRow({ type, lines, title }: { type: string; lines: string[]; title: string }) {
  const getIcon = () => {
    const t = normalizeValue(type);
    if (t === 'phone') return <Phone className="h-5 w-5 text-white" strokeWidth={2} />;
    if (t === 'email') return <Mail className="h-5 w-5 text-white" strokeWidth={2} />;
    return <MapPinned className="h-5 w-5 text-white" strokeWidth={2} />;
  };

  if (!lines || lines.length === 0) return null;

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
        {getIcon()}
      </div>
      <div>
        <h4 className="text-sm font-semibold uppercase text-white/70">{title}</h4>
        <div className="mt-1 space-y-0.5">
          {lines.map((line, idx) => (
            <p key={idx} className="text-sm leading-snug text-white/80">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Footer() {
  const { data: pages = [] } = useGetSitePagesQuery();
  const { data: contactInfo = [] } = useGetContactInfoQuery({ page: 1, limit: 20 });
  const { data: socialLinks = [] } = useGetContactSocialLinksQuery({
    page: 1,
    limit: 20,
    is_active: true,
  });

  const dynamicLinks = pages.map((item) => ({
    label: item.title,
    href: `/policies/${item.slug}`,
  }));
  const quickLinks = [...dynamicLinks, ...staticLinks];
  const groupedInfo = groupContactInfo(contactInfo);
  const footerSocialLinks = sortSocialLinks(socialLinks);

  return (
    <footer className="mt-5 hidden md:block">
      <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 bg-transparent">
        <div
          className="w-full overflow-hidden rounded-t-[72px] lg:rounded-t-[88px]"
          style={{ backgroundColor: COLORS.black }}
        >
          <div className="mx-auto w-full max-w-[1536px] px-10 pb-[72px] pt-[88px] md:px-14 lg:px-20 lg:pb-[82px] lg:pt-[96px] xl:px-24">
            <div className="flex flex-col gap-14 lg:flex-row lg:items-start lg:justify-between lg:gap-28 xl:gap-36">
              {/* Logo + description */}
              <div className="flex w-full max-w-[430px] shrink-0 flex-col lg:min-h-[250px]">
                <img
                  src={IMAGES.logo.white || IMAGES.logo.main}
                  alt="Viking Tin"
                  className="h-auto w-[260px] object-contain lg:w-[300px] xl:w-[330px]"
                />
                <p className="mt-2 max-w-[290px] text-[14px] leading-[1.65] text-white">
                  Viking Tin is a curated destination for modern nicotine
                  pouches, focused on quality, simplicity, and a cleaner
                  experience.
                </p>
              </div>

              <div className="flex-1 lg:pt-3">
                <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-[1fr_1fr_0.9fr] lg:gap-x-12 xl:gap-x-14">
                  {/* Navigation column */}
                  <div className="min-w-0">
                    <h3 className="text-[18px] font-bold leading-none text-white lg:text-[19px]">
                      Navigation
                    </h3>
                    <ul className="mt-5 space-y-[2px]">
                      {navigationLinks.map((item) => (
                        <li key={item.label}>
                          <Link
                            href={item.href}
                            className="text-[15px] leading-[1.5] text-white/90 transition-opacity hover:opacity-80"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Quick Links column */}
                  <div className="min-w-0">
                    <h3 className="text-[18px] font-bold leading-none text-white lg:text-[19px]">
                      Quick Links
                    </h3>
                    <ul className="mt-5 space-y-[2px]">
                      {quickLinks.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className="text-[15px] leading-[1.5] text-white/90 transition-opacity hover:opacity-80"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Information column — phone, email, address with icons */}
                  <div className="min-w-0">
                    <h3 className="text-[18px] font-bold leading-none text-white lg:text-[19px]">
                      Information
                    </h3>
                    <div className="mt-5 space-y-4">
                      {groupedInfo.phone && (
                        <FooterInfoRow
                          type="phone"
                          lines={groupedInfo.phone.lines}
                          title="Phone"
                        />
                      )}
                      {groupedInfo.email && (
                        <FooterInfoRow
                          type="email"
                          lines={groupedInfo.email.lines}
                          title="Email"
                        />
                      )}
                      {groupedInfo.address && (
                        <FooterInfoRow
                          type="address"
                          lines={groupedInfo.address.lines}
                          title="Location"
                        />
                      )}
                      {footerSocialLinks.length > 0 && (
                        <div className="pt-2">
                          <div className="flex flex-wrap items-center gap-3">
                            {footerSocialLinks.map((item) => {
                              const Icon = getSocialIcon(item.platform);
                              return (
                                <a
                                  key={item.id}
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={item.platform}
                                  title={item.platform}
                                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-white transition-opacity hover:opacity-80"
                                >
                                  <Icon size={16} />
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-transparent" />
        </div>
      </div>
    </footer>
  );
}