import type { Bundle } from '@/types/bundles';
import BundleCard from '../bundleCard';

type BundlesGridProps = {
    bundles: Bundle[];
};

export default function BundlesGrid({ bundles }: BundlesGridProps) {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {bundles.map((bundle: any) => (
                <BundleCard key={bundle.id} bundle={bundle} />
            ))}
        </div>
    );
}