"use client";

import React from "react";
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
  PieChart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path?: string;
  children?: MenuItem[];
}

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // If on the login page, show only the GolLogo.
  if (pathname === "/login") {
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

  const menuItems: MenuItem[] = [
    { icon: Home, label: "Projects", path: "/" },
    { icon: LayoutDashboard, label: "My Dashboard", path: "/dashboard" },
    { icon: CheckSquare, label: "My Tasks", path: "/tasks" },
    { icon: CalendarRange, label: "Year-By-Year", path: "/yearbyyear" },
    { 
      icon: TrendingDown, 
      label: "Churn Rates", 
      path: "/churn",
      children: [
        { icon: PieChart, label: "Churn Analysis", path: "/churn-analysis" }
      ]
    },
    { icon: ChartLine, label: "Social Analytics", path: "/social-analytics" },
    { icon: Wallet, label: "Weekly Income", path: "/income" },
    { icon: BarChart2, label: "Web Analytics", path: "/web-analytics" }
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-56 bg-[#1c3145] text-white p-2 shadow-lg flex flex-col justify-between">
      <div>
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
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <div key={item.label}>
                <button
                  onClick={() => item.path && router.push(item.path)}
                  className={cn(
                    "w-full flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                    "hover:bg-[#81bb26]/20",
                    isActive ? "bg-[#81bb26]/30" : "transparent"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
                {item.children && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActive = pathname === child.path;
                      return (
                        <button
                          key={child.label}
                          onClick={() => child.path && router.push(child.path)}
                          className={cn(
                            "w-full flex items-center gap-2 px-4 py-1 rounded-lg transition-colors",
                            "hover:bg-[#81bb26]/20",
                            isChildActive ? "bg-[#81bb26]/30" : "transparent"
                          )}
                        >
                          <ChildIcon className="w-4 h-4" />
                          <span className="font-medium text-sm">{child.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sign Out Button - Placed at the bottom */}
      <button
        onClick={handleSignOut}
        className={cn(
          "w-full flex items-center gap-2 px-4 py-2 rounded-lg transition-colors mt-4",
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
