"use client";

import { cn } from "@/lib/utils";
import { BarChart3, User, Folder, LayoutDashboard, BarChartHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";

const generalNavItems = [
  { href: "/projects", icon: Folder, label: "Проекты" },
  { href: "/stats", icon: BarChart3, label: "Статистика" },
  { href: "/profile", icon: User, label: "Профиль" },
];


export default function BottomNav() {
  const pathname = usePathname();
  const params = useParams();
  const projectId = params.projectId as string | undefined;

  const projectNavItems = projectId ? [
    { href: `/projects/${projectId}`, icon: LayoutDashboard, label: "Доска проекта" },
    { href: `/projects/${projectId}/stats`, icon: BarChartHorizontal, label: "Статистика проекта" },
    { href: "/profile", icon: User, label: "Профиль" },
  ] : [];

  const navItems = projectId ? projectNavItems : generalNavItems;

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t z-10 md:hidden">
      <nav className="flex justify-around items-center h-full">
        {navItems.map((item) => {
          // Use exact match for active state to avoid highlighting multiple items.
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                className="w-6 h-6 mb-1"
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}
