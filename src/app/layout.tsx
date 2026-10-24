import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "latin-ext"], // latin-ext carries ő and ű
  weight: ["400", "600", "700", "800", "900"],
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
    <html lang="hu" className={`${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
