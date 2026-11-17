import AddStrengthLevelDrawer from '@/app/dashboard/_components/AddStrengthLevelDrawer';
import StrengthLevelsTable from '@/app/dashboard/_components/StrengthLevelsTable';

export default function StrengthLevelsPage() {
  return (
    <div className="space-y-5">
      <AddStrengthLevelDrawer />
      <StrengthLevelsTable />
    </div>
  );
}
