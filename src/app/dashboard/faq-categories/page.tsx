import AddFaqCategoryDrawer from '@/app/dashboard/_components/AddFaqCategoryDrawer';
import FaqCategoriesTable from '@/app/dashboard/_components/FaqCategoriesTable';

export default function FaqCategoriesPage() {
  return (
    <div className="space-y-5">
      <AddFaqCategoryDrawer />
      <FaqCategoriesTable />
    </div>
  );
}
