import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FP3 — Finding Publication Project Partner",
  description:
    "Üniversite öğrencileri ve akademisyenler arasında makale/proje ortaklığı kurmayı sağlayan platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
