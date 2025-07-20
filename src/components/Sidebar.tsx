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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";


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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        setIsAuthenticated(true);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
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
    <div className="fixed left-0 top-0 h-full w-56 bg-[#1c3145] text-white p-4 shadow-lg flex items-center justify-center">
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
    <div className="fixed left-0 top-0 h-full w-56 bg-[#1c3145] text-white p-2 shadow-lg flex flex-col">
      <div className="py-2 mb-4 flex justify-center">
        <Image
          src="/GolLogo.png"
          alt="GOL Logo"
          width={120}
          height={38}
          className="object-contain"
          priority
        />
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
                    "w-full flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                    "hover:bg-[#81bb26]/20",
                    isActive ? "bg-[#81bb26]/30" : "transparent"
                  )}
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className={cn(
          "w-full flex items-center gap-2 px-4 py-2 rounded-lg transition-colors mt-2",
          "transparent"
        )}
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Sign Out</span>
      </button>
    </div>
  );
};

export default Sidebar;