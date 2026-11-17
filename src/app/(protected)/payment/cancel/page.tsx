import Header from '@/components/layout/Header';
import TopMarquee from '@/components/layout/topMarquee';
import Footer from '@/components/layout/Footer';
import PaymentResultGuard from '@/lib/PaymentResultGuard';

export default function PaymentCancelPage() {
  return (
    <PaymentResultGuard>
    <div className="min-h-screen flex flex-col bg-[#FBFAF7]">
      <Header />
      <TopMarquee />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-3xl rounded-2xl bg-white p-8 shadow-lg border border-black/5 text-center">
          <h1 className="text-3xl font-bold text-yellow-600">Payment Cancelled</h1>
          <p className="mt-3 text-gray-700">Your payment was cancelled. You can try again whenever you’re ready.</p>
        </div>
      </main>

      <Footer />
    </div>
    </PaymentResultGuard>
  );
}