import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import RefreshHandler from "@/components/RefreshHandler";
import MainContent from "@/components/MainContent";
import { SidebarProvider } from "@/contexts/SidebarContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gol Projects",
  description: "Getting stuff done.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Suspense fallback={null}>
          <RefreshHandler />
        </Suspense>
        <SidebarProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <MainContent>
              {children}
            </MainContent>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}