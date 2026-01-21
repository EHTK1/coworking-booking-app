// app/layout.tsx

import './globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export const metadata = {
  title: 'Coworking Desk Booking',
  description: 'Book desks at our coworking space',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // French is the default locale
  const locale = 'fr';
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
