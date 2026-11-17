import AddTaxRateDrawer from '@/app/dashboard/_components/AddTaxRateDrawer';
import TaxRatesTable from '@/app/dashboard/_components/TaxRatesTable';

export default function TaxRatesPage() {
  return (
    <div className="space-y-5">
      <AddTaxRateDrawer />
      <TaxRatesTable />
    </div>
  );
}
