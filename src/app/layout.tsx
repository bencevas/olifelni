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

/**
 * Applies the theme before first paint. Rendering this after hydration instead would
 * show a white flash on every load for anyone on the dark theme.
 */
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");
if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))
document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The script sets a class the server did not render, so the mismatch is expected.
    <html lang="hu" className={`${archivo.variable} ${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col bg-surface">{children}</body>
    </html>
  );
}
