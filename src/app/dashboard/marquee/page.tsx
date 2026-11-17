import AddMarqueDrawer from '@/app/dashboard/_components/AddMarqueDrawer';
import MarqueTable from '@/app/dashboard/_components/MarqueTable';

export default function DashboardMarqueePage() {
  return (
    <div className="space-y-5">
      <AddMarqueDrawer />
      <MarqueTable />
    </div>
  );
}
