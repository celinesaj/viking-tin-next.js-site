import AddTestimonialDrawer from '@/app/dashboard/_components/AddTestimonialDrawer';
import TestimonialsTable from '@/app/dashboard/_components/TestimonialsTable';

export default function TestimonialsPage() {
  return (
    <div className="space-y-5">
      <AddTestimonialDrawer />
      <TestimonialsTable />
    </div>
  );
}
