// app/layout.tsx

import './globals.css';

export const metadata = {
  title: 'Coworking Desk Booking',
  description: 'Book desks at our coworking space',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
