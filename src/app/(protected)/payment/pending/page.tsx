import Header from '@/components/layout/Header';
import TopMarquee from '@/components/layout/topMarquee';
import Footer from '@/components/layout/Footer';
import PaymentResultGuard from '@/lib/PaymentResultGuard';

export default function PaymentPendingPage() {
  return (
    <PaymentResultGuard>
    <div className="min-h-screen flex flex-col bg-[#FBFAF7]">
      <Header />
      <TopMarquee />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-3xl rounded-2xl bg-white p-8 shadow-lg border border-black/5">
          <h1 className="text-3xl font-bold text-yellow-600">Payment Pending</h1>
          <p className="mt-3 text-gray-700">Your payment is being processed. You'll receive a confirmation shortly — please do not close this window.</p>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-yellow-600 animate-pulse" />
            <span className="text-sm text-gray-500">Checking payment status…</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
    </PaymentResultGuard>
  );
}