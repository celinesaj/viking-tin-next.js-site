import TopMarquee from '@/components/layout/topMarquee';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ensureValidAuthSession } from '@/lib/authServer';

export default async function OrdersPage() {
  await ensureValidAuthSession();

  return (
    <>
      <TopMarquee />
      <Header />
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center">My Orders</h1>
        <p className="text-center text-gray-600 mt-4">
          Your order history will appear here.
        </p>
      </div>
      <Footer />
    </>
  );
}