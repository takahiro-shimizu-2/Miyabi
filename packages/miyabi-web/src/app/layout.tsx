import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Miyabi Workflow Editor',
  description: 'Visual workflow editor for autonomous AI development',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
