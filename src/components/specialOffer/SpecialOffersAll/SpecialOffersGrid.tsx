import type { SpecialOffer } from '@/types/special-offers';
import BundleCard from '../offerCard';

type SpecialOffersGridProps = {
    offers: SpecialOffer[];
};

export default function SpecialOffersGrid({ offers }: SpecialOffersGridProps) {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {offers.map((offer: any) => (
                <BundleCard key={offer.id} offer={offer} />
            ))}
        </div>
    );
}