"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import {
  Home,
  CheckSquare,
  CalendarRange,
  TrendingDown,
  BarChart2,
  ChartLine,
  LogOut,
  LayoutDashboard,
  PieChart,
  Users,
  Trophy,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { useSidebar } from "@/contexts/SidebarContext";


interface MenuItem {
  icon?: React.ElementType;
  label: string;
  path?: string;
  isHeader?: boolean;
}

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  
  // Consolidated state
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          setIsAuthenticated(false);
          return;
        }

        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        setIsAuthenticated(true);
        setLoading(false);
      } else if (event === 'SIGNED_OUT' || !session?.user) {
        setIsAuthenticated(false);
        setLoading(false);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [supabase]);

  const allMenuItems: MenuItem[] = [
    { icon: Home, label: "Projects", path: "/" },
    { icon: LayoutDashboard, label: "My Dashboard", path: "/dashboard" },
    { icon: CheckSquare, label: "My Tasks", path: "/tasks" },
    { icon: CalendarRange, label: "Year-By-Year", path: "/yearbyyear" },
    { isHeader: true, label: "Leagues" },
    { icon: TrendingDown, label: "Churn Rates", path: "/churn" },
    { icon: PieChart, label: "Churn Analysis", path: "/churn-analysis" },
    { icon: Trophy, label: "League Analysis", path: "/league-organisers" },
    { isHeader: true, label: "Bookings" },
    { icon: Users, label: "BB Analysis", path: "/block-bookers" },
    { icon: Calendar, label: "Bookings Analysis", path: "/bookings-analysis" },
    { isHeader: true, label: "Analytics" },
    { icon: ChartLine, label: "Social Analytics", path: "/social-analytics" },
    { icon: BarChart2, label: "Web Analytics", path: "/web-analytics" },
  ];

  const menuItems = allMenuItems;
  
  const renderLogo = () => (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-[#1c3145] text-white p-4 shadow-lg flex items-center justify-center",
      isCollapsed ? "w-16" : "w-56"
    )}>
      <Image
        src="/GolLogo.png"
        alt="GOL Logo"
        width={120}
        height={38}
        className="object-contain"
        priority
      />
    </div>
  );

  if (loading) {
    return renderLogo();
  }
  
  if (pathname === "/login" || !isAuthenticated) {
    return renderLogo();
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-[#1c3145] text-white p-2 shadow-lg flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-56"
    )}>
      <div className={cn(
        "py-2 mb-4 flex",
        isCollapsed ? "justify-center" : "justify-center"
      )}>
        {!isCollapsed && (
          <Image
            src="/GolLogo.png"
            alt="GOL Logo"
            width={120}
            height={38}
            className="object-contain"
            priority
          />
        )}
      </div>
      
      <div className={cn(
        "flex mb-4",
        isCollapsed ? "justify-center" : "justify-end pr-2"
      )}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md hover:bg-[#81bb26]/20 transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
      
      
      <div className="flex-1 overflow-y-auto pb-2 
        [&::-webkit-scrollbar]:hidden hover:[&::-webkit-scrollbar]:block 
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-track-piece]:bg-transparent
        [&::-webkit-scrollbar-corner]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-gray-500/50
        [&::-webkit-scrollbar-thumb]:rounded-full
        [-ms-overflow-style:none] hover:[-ms-overflow-style:auto]
        [scrollbar-width:none] hover:[scrollbar-width:thin]
        [scrollbar-color:rgba(107,114,128,0.5)_transparent]">
        <div className="space-y-1">
          {menuItems.map((item, index) => {
            if (item.isHeader) {
              if (isCollapsed) return null;
              return (
                <div key={`header-${index}`} className="px-4 py-2 mt-3 mb-1">
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    {item.label}
                  </span>
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = pathname === item.path;
            
            return (
              <div key={`item-${index}`}>
                <button
                  onClick={() => item.path && router.push(item.path)}
                  className={cn(
                    "w-full flex items-center rounded-lg transition-colors",
                    "hover:bg-[#81bb26]/20",
                    isActive ? "bg-[#81bb26]/30" : "transparent",
                    isCollapsed ? "justify-center p-2" : "gap-2 px-4 py-2"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className={cn(
          "w-full flex items-center rounded-lg transition-colors mt-2",
          "transparent",
          isCollapsed ? "justify-center p-2" : "gap-2 px-4 py-2"
        )}
        title={isCollapsed ? "Sign Out" : undefined}
      >
        <LogOut className="w-5 h-5" />
        {!isCollapsed && <span className="font-medium">Sign Out</span>}
      </button>
    </div>
  );
};

export default Sidebar;