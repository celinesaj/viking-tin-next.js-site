import AddContactInfoDrawer from '@/app/dashboard/_components/AddContactInfoDrawer';
import ContactInfoTable from '@/app/dashboard/_components/ContactInfoTable';

export default function ContactInfoPage() {
  return (
    <div className="space-y-5">
      <AddContactInfoDrawer />
      <ContactInfoTable />
    </div>
  );
}
