import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockSpot - Find What You Need, Where It Is",
  description:
    "Real-time local inventory discovery and demand-matching platform. Find products at verified shops near you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
