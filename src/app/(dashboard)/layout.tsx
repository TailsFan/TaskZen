'use client';

import { BarChart3, LayoutGrid, User as UserIcon, Folder, LayoutDashboard, BarChartHorizontal } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import BottomNav from '@/components/bottom-nav';
import { Separator } from '@/components/ui/separator';

const generalNavItems = [
  { href: "/projects", icon: Folder, label: "Все проекты" },
  { href: "/stats", icon: BarChart3, label: "Общая статистика" },
  { href: "/profile", icon: UserIcon, label: "Профиль" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();

  const projectId = params.projectId as string | undefined;

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 border-b p-4">
           <Skeleton className="h-8 w-48" />
        </header>
        <main className="flex-1 p-4 sm:p-6">
            <div className="space-y-4">
                <Skeleton className="h-10 w-1/2" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <Skeleton className="h-48 rounded-lg" />
                    <Skeleton className="h-48 rounded-lg" />
                    <Skeleton className="h-48 rounded-lg" />
                </div>
            </div>
        </main>
      </div>
    );
  }
  
  const projectNavItems = projectId ? [
    { href: `/projects/${projectId}`, icon: LayoutDashboard, label: "Доска проекта" },
    { href: `/projects/${projectId}/stats`, icon: BarChartHorizontal, label: "Статистика проекта" },
  ] : [];


  const renderNavItems = (items: {href: string, icon: any, label: string}[]) => (
     items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              isActive && "bg-muted text-primary"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })
  );

  const sidebarNav = (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
        {projectId && (
            <>
                {renderNavItems(projectNavItems)}
                <Separator className="my-2" />
            </>
        )}
        {renderNavItems(generalNavItems)}
    </nav>
  );

  return (
     <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <LayoutGrid className="h-6 w-6" />
              <span className="">TaskZen</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sidebarNav}
          </div>
        </div>
      </div>
       <div className="flex flex-col min-h-screen overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
