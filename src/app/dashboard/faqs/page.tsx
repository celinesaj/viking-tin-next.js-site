import AddFaqDrawer from '@/app/dashboard/_components/AddFaqDrawer';
import FaqTable from '@/app/dashboard/_components/FaqTable';

export default function FaqPage() {
  return (
    <div className="space-y-5">
      <AddFaqDrawer />
      <FaqTable />
    </div>
  );
}
