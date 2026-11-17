import AddBrandDrawer from '@/app/dashboard/_components/AddBrandDrawer';
import BrandsTable from '@/app/dashboard/_components/BrandsTable';

export default function BrandsPage() {
  return (
    <div className="space-y-5">
      <AddBrandDrawer />
      <BrandsTable />
    </div>
  );
}
