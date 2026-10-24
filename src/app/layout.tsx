import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";

// latin-ext carries ő and ű.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Oli Felni — Használt és új alufelnik, gumiabroncsok",
    template: "%s | Oli Felni",
  },
  description:
    "Gyári és utángyártott alufelni szettek, téli és nyári gumiabroncsok. Országos szállítás, személyes átvétel Szegeden.",
  openGraph: { type: "website", locale: "hu_HU", siteName: "Oli Felni" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu" className={`${archivo.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white">{children}</body>
    </html>
  );
}
