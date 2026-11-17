import AddProductDrawer from '@/app/dashboard/_components/AddProductDrawer';
import ProductsTable from '@/app/dashboard/_components/ProductsTable';

export default function ProductsPage() {
  return (
    <div className="space-y-5">
      <AddProductDrawer />
      <ProductsTable />
    </div>
  );
}
