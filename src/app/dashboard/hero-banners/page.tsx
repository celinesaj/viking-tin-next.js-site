import AddHeroBannerDrawer from '@/app/dashboard/_components/AddHeroBannerDrawer';
import HeroBannersTable from '@/app/dashboard/_components/HeroBannersTable';

export default function HeroBannersPage() {
  return (
    <div className="space-y-5">
      <AddHeroBannerDrawer />
      <HeroBannersTable />
    </div>
  );
}
