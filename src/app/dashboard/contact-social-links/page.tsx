import AddContactSocialLinksDrawer from '@/app/dashboard/_components/AddContactSocialLinksDrawer';
import ContactSocialLinksTable from '@/app/dashboard/_components/ContactSocialLinksTable';

export default function ContactSocialLinksPage() {
  return (
    <div className="space-y-5">
      <AddContactSocialLinksDrawer />
      <ContactSocialLinksTable />
    </div>
  );
}
