'use client';

import Image from 'next/image';
import { MapPin, Phone, ArrowUpRight, ArrowRight } from 'lucide-react';
import type { PointOfSaleLocation } from '@/types/pointsOfSale';
import { buildGoogleMapsUrl } from '@/features/point-of-sale/utils';

type Props = {
  location: PointOfSaleLocation & {
    distanceKm?: number;
  };
};

export default function StoreCard({ location }: Props) {
  const openMap = () => {
    window.open(
      buildGoogleMapsUrl(location.latitude, location.longitude),
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <article className="grid grid-cols-[140px_minmax(0,1fr)] gap-5 border-b border-black/15 pb-8 pt-2 md:grid-cols-[190px_minmax(0,1fr)] md:gap-7">
      <div className="min-w-0">
        <div className="relative h-[140px] overflow-visible rounded-[28px] bg-[#d8d8d8] md:h-[160px]">
          <Image
            src={location.imageUrl}
            alt={location.name}
            fill
            className="object-cover rounded-[28px]"
          />

          {/* BUTTON HALF IN / HALF OUT */}
          <button
            type="button"
            onClick={openMap}
            className="group absolute left-1/2 top-full z-10 flex h-[42px] -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2 rounded-full bg-black px-5 text-[18px] font-semibold text-white shadow-lg transition-all duration-300 hover:bg-white hover:text-black"
          >
            <span>View</span>

            <span className="relative flex h-[28px] w-[28px] items-center justify-center overflow-hidden rounded-full bg-white text-black transition-all duration-300 group-hover:bg-black group-hover:text-white">

              {/* Diagonal arrow (default) */}
              <ArrowUpRight
                size={16}
                className="absolute transition-all duration-300 group-hover:translate-x-3 group-hover:-translate-y-3 group-hover:opacity-0"
              />

              {/* Straight arrow (on hover) */}
              <ArrowRight
                size={16}
                className="absolute translate-x-[-12px] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
              />

            </span>
          </button>
        </div>
      </div>

      <div className="min-w-0 pt-2">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-[20px] font-bold uppercase leading-none text-black md:text-[30px]">
            {location.name}
          </h3>

          {typeof location.distanceKm === 'number' && (
            <span className="rounded-full bg-black px-3 py-1 text-[12px] font-medium text-white">
              {location.distanceKm.toFixed(1)} km away
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3 text-[15px] text-black/55">
          <MapPin size={16} className="shrink-0 text-black" />
          <span>{location.city}</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-3 text-[12px] text-black/45 md:text-[14px]">


          {location.phone && (
            <div className="flex items-center gap-2">
              <Phone size={16} className="shrink-0 text-black" />
              <span>{location.phone}</span>
            </div>
          )}

          {location.phoneSecondary && (
            <div className="flex items-center gap-2">
              <Phone size={16} className="shrink-0 text-black" />
              <span>{location.phoneSecondary}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}