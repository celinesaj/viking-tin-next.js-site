import AddPointOfSaleDrawer from '@/app/dashboard/_components/AddPointOfSaleDrawer';
import PointOfSaleTable from '@/app/dashboard/_components/PointOfSaleTable';

export default function PointOfSalePage() {
  return (
    <div className="space-y-5">
      <AddPointOfSaleDrawer />
      <PointOfSaleTable />
    </div>
  );
}
