import AddOfferDrawer from '@/app/dashboard/_components/AddOfferDrawer';
import OffersTable from '@/app/dashboard/_components/OffersTable';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function OffersPage() {
  return (
    <div className="min-w-0 space-y-5">
      <ToastContainer position="top-right" autoClose={3000} />
      <AddOfferDrawer />
      <OffersTable />
    </div>
  );
}
