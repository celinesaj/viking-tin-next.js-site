'use client';

import { useGetRelatedItemsQuery } from '@/features/related-items/relatedItemsApi';
import type { RelatedSourceType } from '@/types/related-items';
import ProductCard from '../product/ProductCard';
import BundleCard from '../bundles/bundleCard';
import SpecialOfferCard from '../specialOffer/offerCard';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

type Props = {
    sourceId: string;
    sourceType: RelatedSourceType;
    title?: string;
};

function RelatedItemsSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div
                    key={i}
                    className="h-[380px] animate-pulse rounded-[24px] bg-[#f3f3f3]"
                />
            ))}
        </div>
    );
}

export default function RelatedItemsSection({
    sourceId,
    sourceType,
    title = 'Related Items',
}: Props) {
    const { data, isLoading, isError } = useGetRelatedItemsQuery({
        source_id: sourceId,
        source_type: sourceType,
    });

    const items = [...(data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

    if (isLoading) {
        return (
            <section className="py-10 md:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h2 className="mb-6 text-[28px] font-extrabold uppercase text-black md:text-[36px]">
                        {title}
                    </h2>
                    <RelatedItemsSkeleton />
                </div>
            </section>
        );
    }

    if (isError || !items.length) {
        return null;
    }

    return (
        <section className="py-10 md:py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h2 className="mb-6 text-[28px] font-extrabold uppercase text-black md:text-[36px]">
                    {title}
                </h2>

                <Swiper
                    modules={[Navigation, Pagination]}
                    spaceBetween={24}
                    slidesPerView={2}
                    navigation
                    pagination={{ clickable: true }}
                    breakpoints={{
                        640: {
                            slidesPerView: 2,
                        },
                        1024: {
                            slidesPerView: 3,
                        },
                        1280: {
                            slidesPerView: 3,
                        },
                    }}
                    className="related-items-swiper !pb-12"
                >
                    {items.map((item) => (
                        <SwiperSlide key={item.id} className="h-auto">
                            <div className="h-full">
                                {item.relatedType === 'product' && (
                                    <ProductCard product={item.related} />
                                )}

                                {item.relatedType === 'bundle' && (
                                    <BundleCard bundle={item.related} />
                                )}

                                {item.relatedType === 'special_offer' && (
                                    <SpecialOfferCard offer={item.related} />
                                )}
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </section>
    );
}