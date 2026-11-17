import OtpVerificationContent from '@/components/auth/OtpVerificationContent';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import TopMarquee from '@/components/layout/topMarquee';

export default function VerifySignupPage() {
    return (
        <>
            <TopMarquee />
            <Header />
            <OtpVerificationContent />
            <Footer />
        </>
    );
}