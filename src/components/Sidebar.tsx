"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, CheckSquare, CalendarRange, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { icon: Home, label: 'Projects', path: '/' },
    { icon: CheckSquare, label: 'My Tasks', path: '/tasks' },
    { icon: CalendarRange, label: 'Year-By-Year', path: '/yearly' },
    { icon: Wallet, label: 'Weekly Income', path: '/income' },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-[#1c3145] text-white p-4 shadow-lg">
      <div className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                "hover:bg-[#81bb26]/20",
                isActive ? "bg-[#81bb26]/30" : "transparent"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          )}
        )}
      </div>
    </div>
  );
};

export default Sidebar;