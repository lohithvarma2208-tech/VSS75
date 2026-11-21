import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/lib/context/AppContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Toast from '@/components/ui/Toast';
import { CampusVerificationModal } from '@/components/auth/CampusVerificationModal';
import CampusBenefitsAdModal from '@/components/modals/CampusBenefitsAdModal';
import AmbientBackgroundLayer from '@/components/common/AmbientBackgroundLayer';
import VideoThemeSwitcher from '@/components/common/VideoThemeSwitcher';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Virtual Student Space (VSS) — Campus Academic Knowledge Network',
  description:
    'Unleash the power of campus knowledge on Virtual Student Space (VSS). Academic resource-sharing network for KL University students.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${mono.variable}`}>
      <body className="font-sans antialiased bg-[#070A11] text-white selection:bg-[#A855F7] selection:text-white min-h-screen p-2 sm:p-4 md:p-6 lg:p-8">
        {/* Posh rounded canvas container with Agentic Midnight theme and translucent glass for video visibility */}
        <div className="max-w-[1600px] mx-auto rounded-[2rem] sm:rounded-[2.75rem] border border-white/10 bg-[#0B0F19]/35 shadow-2xl shadow-purple-950/20 overflow-hidden flex flex-col min-h-[92vh] relative">
          <AppProvider>
            <AmbientBackgroundLayer />
            <Navbar />
            <main className="flex-1 bg-forest-grid relative z-10">{children}</main>
            <Footer />
            <Toast />
            <CampusVerificationModal />
            <CampusBenefitsAdModal />
            <VideoThemeSwitcher />
          </AppProvider>
        </div>
      </body>
    </html>
  );
}
