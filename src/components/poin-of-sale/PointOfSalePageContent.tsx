// src/components/point-of-sale/PointOfSalePageContent.tsx
'use client';

import { useMemo, useState } from 'react';
import { LocateFixed, MapPinned } from 'lucide-react';
import type { UserCoordinates } from '@/types/pointsOfSale';
import {
    getNearbyLocations,
    sortLocationsByDistance,
} from '@/features/point-of-sale/utils';
import { useGetPointOfSaleLocationsQuery } from '@/features/point-of-sale/pointOfSaleApi';
import PointOfSaleHero from './PointOfSaleHero';
import StoreCard from './StoreCard';
import Container from '@/components/common/Container';
import Pagination from '@/components/common/pagination';

export default function PointOfSalePageContent() {
    const [userCoords, setUserCoords] = useState<UserCoordinates | null>(null);
    const [page, setPage] = useState(1);
    const [locationStatus, setLocationStatus] = useState<
        'idle' | 'loading' | 'success' | 'denied' | 'error'
    >('idle');

    const { data, isLoading, isError } = useGetPointOfSaleLocationsQuery({
        page,
        limit: 20,
        is_active: true,
    });

    const locations = data?.data ?? [];
    const pagination = data?.pagination;

    const nearbyLocations = useMemo(() => {
        if (!userCoords) return [];
        return getNearbyLocations(locations, userCoords, 25);
    }, [locations, userCoords]);

    const sortedLocations = useMemo(() => {
        if (!userCoords) return locations;
        return sortLocationsByDistance(locations, userCoords);
    }, [locations, userCoords]);

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setLocationStatus('error');
            return;
        }

        setLocationStatus('loading');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserCoords({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setLocationStatus('success');
            },
            (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                    setLocationStatus('denied');
                    return;
                }
                setLocationStatus('error');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
            }
        );
    };

    const showNoNearbyMessage =
        locationStatus === 'success' && userCoords && nearbyLocations.length === 0;

    return (
        <main className="pb-24 md:pt-5">
            <Container>
                <div className="mx-auto max-w-[1220px]">
                    <PointOfSaleHero
                        title="Point Of Store"
                        description="Find Viking Tin locations near you and explore all available stores."
                        bannerImage="/images/point-of-sale-banner.jpg"
                    />

                    <section className="pt-12 md:pt-16">
                        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                            <div>
                                <h2 className="text-[35px] font-bold uppercase leading-none text-black md:text-[55px]">
                                    Point Of Store
                                </h2>

                                <p className="mt-4 max-w-[760px] text-[16px] leading-[1.5] text-black/45 md:text-[18px]">
                                    Allow location access to show the stores closest to you. If no
                                    nearby store is found, all available locations will still be
                                    displayed below.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={requestLocation}
                                className="inline-flex h-[54px] items-center justify-center gap-2 rounded-full bg-black px-6 text-[15px] font-medium uppercase text-white transition hover:opacity-90"
                            >
                                <LocateFixed size={18} />
                                <span>
                                    {locationStatus === 'loading'
                                        ? 'Locating...'
                                        : 'Use My Location'}
                                </span>
                            </button>
                        </div>

                        {(locationStatus === 'denied' || locationStatus === 'error') && (
                            <div className="mt-6 rounded-[22px] border border-black/10 bg-white px-5 py-4 text-[15px] text-black/60">
                                {locationStatus === 'denied'
                                    ? 'Location permission was denied. Showing all store locations instead.'
                                    : 'We could not access your location. Showing all store locations instead.'}
                            </div>
                        )}

                        {userCoords && nearbyLocations.length > 0 && (
                            <div className="mt-10 rounded-[28px] border border-black/10 bg-white p-5 md:p-7">
                                <div className="mb-6 flex items-center gap-3">
                                    <MapPinned size={24} className="text-black" />
                                    <h3 className="text-[24px] font-semibold uppercase text-black md:text-[32px]">
                                        Stores Near You
                                    </h3>
                                </div>

                                <div className="space-y-8">
                                    {nearbyLocations.map((location) => (
                                        <StoreCard key={`nearby-${location.id}`} location={location} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {showNoNearbyMessage && (
                            <div className="mt-10 rounded-[28px] border border-black/10 bg-white p-5 text-[16px] text-black/55 md:p-7">
                                No nearby stores were found for your location yet. You can still
                                browse all available locations below.
                            </div>
                        )}

                        {isLoading ? (
                            <div className="mt-12 space-y-10">
                                {Array.from({ length: 3 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="h-[190px] animate-pulse rounded-[28px] bg-black/5"
                                    />
                                ))}
                            </div>
                        ) : isError ? (
                            <div className="mt-12 rounded-[28px] border border-black/10 bg-white p-6 text-[16px] text-black/55">
                                Failed to load store locations.
                            </div>
                        ) : (
                            <>
                                <div className="mt-12 space-y-10">
                                    {sortedLocations.map((location) => (
                                        <StoreCard key={location.id} location={location} />
                                    ))}
                                </div>

                                {!!pagination && pagination.totalPages > 1 && (
                                    <Pagination
                                        currentPage={pagination.page}
                                        totalPages={pagination.totalPages}
                                        onPageChange={setPage}
                                    />
                                )}
                            </>
                        )}
                    </section>
                </div>
            </Container>
        </main>
    );
}