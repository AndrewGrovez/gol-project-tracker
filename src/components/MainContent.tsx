"use client";

import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

interface MainContentProps {
  children: React.ReactNode;
}

const MainContent = ({ children }: MainContentProps) => {
  const { isCollapsed } = useSidebar();

  return (
    <main className={cn(
      "flex-1 transition-all duration-300",
      isCollapsed ? "pl-16" : "pl-56"
    )}>
      {children}
    </main>
  );
};

export default MainContent;