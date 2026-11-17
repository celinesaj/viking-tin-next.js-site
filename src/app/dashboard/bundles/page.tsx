import AddBundleDrawer from '@/app/dashboard/_components/AddBundleDrawer';
import BundlesTable from '@/app/dashboard/_components/BundlesTable';

export default function BundlesPage() {
  return (
    <div className="space-y-5">
      <AddBundleDrawer />
      <BundlesTable />
    </div>
  );
}
