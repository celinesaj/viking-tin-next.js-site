import './globals.css';
import StoreProvider from '@/store/provider';
import AgeGateProvider from '@/components/common/AgeGateProvider';
import { Mulish } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import NetworkStatus from '@/components/common/NetworkStatus';
import MobileBottomNavLoader from '@/components/layout/MobileBottomNavLoader';
export const metadata = {
  title: {
    default: 'Buy Premium Nicotine Pouches in UAE | Viking Tin Dubai',
    template: '%s | Viking Tin'
  },
  verification: {
    google: '7c8A5SWSE_VeQ5WFIdxt529E7pJuOmf3o1Ca4-RslKM',
  },
  description: 'Experience a smooth, smoke-free nicotine hit with Viking Tin. Shop curated, premium nicotine pouches in Dubai & accross the UAE. Fast delivery & trusted brands.',
  metadataBase: new URL('https://vikingtin.ae'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/images/logo/logo.png',
  },
  
};
const mulish = Mulish({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mulish',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${mulish.variable} `} suppressHydrationWarning>
      <body className="font-sans overflow-x-hidden antialiased " suppressHydrationWarning>
        <StoreProvider>
          <AgeGateProvider>
                <NetworkStatus />
           <div className="pb-[90px] md:pb-0">
              {children}
            </div>
            <Toaster
              position="bottom-center"
              toastOptions={{
                duration: 2200,
                style: {
                  background: '#111111',
                  color: '#ffffff',
                  borderRadius: '9999px',
                  padding: '12px 18px',
                  fontSize: '14px',
                  fontWeight: 500,
                },
              }}
            />
            <MobileBottomNavLoader />
          </AgeGateProvider>
        </StoreProvider>
      </body>
    </html>
  );
}