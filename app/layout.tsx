import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import "leaflet/dist/leaflet.css";
import { Toaster } from "sonner";
import { AuthSyncProvider } from "./contexts/AuthSyncContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Smart Biogas",
    template: "%s | Smart Biogas",
  },
  description:
    "Sistem monitoring biogas berbasis IoT untuk memantau flowrate, tekanan, suhu, energi, status perangkat, dan histori data melalui dashboard web.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthSyncProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </AuthSyncProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
