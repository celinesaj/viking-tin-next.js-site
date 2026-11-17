import AddSpecialOfferDrawer from '@/app/dashboard/_components/AddSpecialOfferDrawer';
import SpecialOffersTable from '@/app/dashboard/_components/SpecialOffersTable';

export default function SpecialOffersPage() {
  return (
    <div className="min-w-0 space-y-5">
      <AddSpecialOfferDrawer />
      <SpecialOffersTable />
    </div>
  );
}
