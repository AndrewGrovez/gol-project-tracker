import type { Metadata } from "next";
import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import RefreshHandler from "@/components/RefreshHandler";
import MainContent from "@/components/MainContent";
import { SidebarProvider } from "@/contexts/SidebarContext";
import "./globals.css";
import "rsuite/dist/rsuite.min.css";

export const metadata: Metadata = {
  title: "Gol Projects",
  description: "Getting stuff done.",
  icons: {
    icon: "/GolLogo.png",
    shortcut: "/GolLogo.png",
    apple: "/GolLogo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <Suspense fallback={null}>
          <RefreshHandler />
        </Suspense>
        <SidebarProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <MainContent>{children}</MainContent>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
