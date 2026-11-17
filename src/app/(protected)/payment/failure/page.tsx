import Header from '@/components/layout/Header';
import TopMarquee from '@/components/layout/topMarquee';
import Footer from '@/components/layout/Footer';
import PaymentResultGuard from '@/lib/PaymentResultGuard';

export default function PaymentFailurePage() {
  return (
    <PaymentResultGuard>
    <div className="min-h-screen flex flex-col bg-[#FBFAF7]">
      <Header />
      <TopMarquee />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-3xl rounded-2xl bg-white p-8 shadow-lg border border-black/5 text-center">
          <h1 className="text-3xl font-bold text-red-600">Payment Failed</h1>
          <p className="mt-3 text-gray-700">Something went wrong with your payment. Please try again or use a different payment method.</p>

          <div className="mt-6">
            <a href="/checkout" className="inline-block rounded-full bg-red-600 px-5 py-2 text-white font-semibold hover:opacity-90">Try Again</a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
    </PaymentResultGuard>
  );
}