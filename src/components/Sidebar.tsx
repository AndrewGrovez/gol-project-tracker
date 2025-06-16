"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import {
  Home,
  CheckSquare,
  CalendarRange,
  Wallet,
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
// Admin UIDs that can see analytics
const ADMIN_UIDS = [
  '5e7d4220-1d39-4622-9770-a6575d627c90',
  'e394f160-e77a-4276-8b74-f7639530d116',
  '300a3e45-48c7-4de4-8516-b737e18dcb23',
  'b9af8044-830d-4aef-aa11-40927a22badd',
  '9a6a4f60-0fcf-4afc-a57c-bdb5d91045db',
  '0c218add-950b-45dc-8b58-75c92c7d53bc'
];

interface MenuItem {
  icon?: React.ElementType;
  label: string;
  path?: string;
  isHeader?: boolean;
  requiresAnalytics?: boolean; // New property to control analytics access
}

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Check authentication and get user ID
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data, error } = await supabase.auth.getUser();
        const isAuth = !!data?.user && !error;
        setIsAuthenticated(isAuth);
        setCurrentUserId(data?.user?.id || null);
      } catch {
        setIsAuthenticated(false);
        setCurrentUserId(null);
      }
    }
    checkAuth();
  }, [supabase]);

  // Check if current user is admin
  const isAdmin = currentUserId && ADMIN_UIDS.includes(currentUserId);

  // If on the login page or not authenticated, show only the logo
  if (pathname === "/login" || !isAuthenticated) {
    return (
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
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

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
    { isHeader: true, label: "Analytics", requiresAnalytics: true },
    { icon: ChartLine, label: "Social Analytics", path: "/social-analytics", requiresAnalytics: true },
    { icon: BarChart2, label: "Web Analytics", path: "/web-analytics", requiresAnalytics: true },
    { icon: Wallet, label: "Weekly Income", path: "/income", requiresAnalytics: true },
  ];

  // Filter menu items based on user ID
  const menuItems = allMenuItems.filter(item => {
    if (item.requiresAnalytics) {
      return isAdmin;
    }
    return true;
  });

  // Don't render sidebar content if still loading user
  if (!currentUserId && isAuthenticated) {
    return (
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
  }

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
      
      {/* Admin indicator (optional) */}
      {isAdmin && (
        <div className="px-4 py-1 mb-2">
          <span className="text-xs text-green-400 font-medium uppercase">
            Admin
          </span>
        </div>
      )}
      
      {/* Scrollable menu area */}
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

      {/* Sign Out Button - Placed at the bottom */}
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