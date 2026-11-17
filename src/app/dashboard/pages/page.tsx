import AddPageDrawer from '@/app/dashboard/_components/AddPageDrawer';
import PagesTable from '@/app/dashboard/_components/PagesTable';

export default function PagesPage() {
  return (
    <div className="space-y-5">
      <AddPageDrawer />
      <PagesTable />
    </div>
  );
}
