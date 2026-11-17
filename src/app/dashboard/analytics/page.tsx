import BundleSalesChart from '@/app/dashboard/_components/BundleSalesChart';
import ProductSalesChart from '@/app/dashboard/_components/ProductSalesChart';
import SpecialOfferSalesChart from '@/app/dashboard/_components/SpecialOfferSalesChart';

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6">
      <ProductSalesChart />
      <BundleSalesChart />
      <SpecialOfferSalesChart />
    </div>
  );
}
