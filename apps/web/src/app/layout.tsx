import type { Metadata } from 'next';
import { satoshi } from './fonts';
import './globals.css';
import { Header } from '@/components/header';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth-provider';
import { CartProvider } from '@/modules/cart/context/cart-context';
import { CheckoutProvider } from '@/modules/checkout/context/checkout-context';
import { ThemeProvider } from '@/components/theme-provider';
import { HolidayThemeProvider } from '@/components/holiday-theme-provider';
import { HolidayBanner } from '@/components/holiday-banner';
import { HolidayParticles } from '@/components/holiday-particles';

export const metadata: Metadata = {
  title: 'Elecshop',
  description: 'Modern eCommerce platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${satoshi.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <AuthProvider>
              <CartProvider>
                <CheckoutProvider>
                  {/* HolidayThemeProvider must wrap the rest so that
                      HolidayBanner and HolidayParticles can read the context */}
                  <HolidayThemeProvider>
                    {/* Banner sits above the sticky header */}
                    <HolidayBanner />
                    <Header />
                    <main className="flex-1">{children}</main>
                    <Toaster />
                    {/* Particles render on top of everything */}
                    <HolidayParticles />
                  </HolidayThemeProvider>
                </CheckoutProvider>
              </CartProvider>
            </AuthProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
