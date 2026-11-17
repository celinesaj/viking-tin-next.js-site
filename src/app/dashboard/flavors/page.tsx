import AddFlavorDrawer from '@/app/dashboard/_components/AddFlavorDrawer';
import FlavorsTable from '@/app/dashboard/_components/FlavorsTable';

export default function FlavorsPage() {
  return (
    <div className="space-y-5">
      <AddFlavorDrawer />
      <FlavorsTable />
    </div>
  );
}
