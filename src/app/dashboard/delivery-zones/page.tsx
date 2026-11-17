import AddDeliveryZoneDrawer from '@/app/dashboard/_components/AddDeliveryZoneDrawer';
import DeliveryZonesTable from '@/app/dashboard/_components/DeliveryZonesTable';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function DeliveryZonesPage() {
  return (
    <div className="min-w-0 space-y-5">
      <ToastContainer position="top-right" autoClose={3000} />
      <AddDeliveryZoneDrawer />
      <DeliveryZonesTable />
    </div>
  );
}
