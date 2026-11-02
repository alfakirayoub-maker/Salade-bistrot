import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/app/fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Admin · Bistrot Salad Bar", template: "%s · Admin Bistrot Salad Bar" },
  robots: { index: false, follow: false },
  icons: { icon: "/brand/logo-mark.png" },
};

export const viewport: Viewport = { themeColor: "#f7f5ef", width: "device-width", initialScale: 1, viewportFit: "cover" };

/** The staff area is French-only and has its own root layout. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
