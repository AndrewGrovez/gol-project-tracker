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
  LayoutDashboard, // Dashboard icon imported
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

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

  const menuItems = [
    { icon: Home, label: "Projects", path: "/" },
    { icon: LayoutDashboard, label: "My Dashboard", path: "/dashboard" }, // Added Dashboard
    { icon: CheckSquare, label: "My Tasks", path: "/tasks" },
    { icon: CalendarRange, label: "Year-By-Year", path: "/yearbyyear" },
    { icon: TrendingDown, label: "Churn Rates", path: "/churn" },
    { icon: ChartLine, label: "Social Analytics", path: "/social-analytics" },
    { icon: Wallet, label: "Weekly Income", path: "/income" },
    { icon: BarChart2, label: "Web Analytics", path: "/web-analytics" },
    { icon: LogOut, label: "Sign Out" },
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
          {menuItems.slice(0, menuItems.length - 1).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => item.path ? router.push(item.path) : {}}
                className={cn(
                  "w-full flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                  "hover:bg-[#81bb26]/20",
                  isActive ? "bg-[#81bb26]/30" : "transparent"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
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