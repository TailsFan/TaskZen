import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: React.ReactNode;
  backHref?: string;
  actions?: React.ReactNode;
  className?: string;
};

export default function PageHeader({ title, backHref, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b px-4 py-3 md:px-6", className)}>
      <div className="flex items-center justify-start flex-wrap gap-x-4 gap-y-2">
        <div className="flex items-center gap-2 flex-shrink-0">
          {backHref && (
            <Button variant="ghost" size="icon" asChild className="-ml-2">
              <Link href={backHref}>
                <ArrowLeft className="w-5 h-5" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
          )}
          <h1 className="font-headline text-2xl font-bold text-foreground truncate">
            {title}
          </h1>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
