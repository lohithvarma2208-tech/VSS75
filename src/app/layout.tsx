import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/lib/context/AppContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Toast from '@/components/ui/Toast';
import { CampusVerificationModal } from '@/components/auth/CampusVerificationModal';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-sans', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'VSS — The student resource space',
  description: 'Find and share useful course resources with the KLU student community.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-[#09090b] font-sans text-white selection:bg-violet-400/30">
        <AppProvider>
          <Navbar />
          <main className="min-h-[70vh] pb-28 md:pb-0">{children}</main>
          <Footer />
          <Toast />
          <CampusVerificationModal />
        </AppProvider>
      </body>
    </html>
  );
}
