"use client";

import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/theme-provider";
import { useEffect, useState } from "react";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // return a placeholder to avoid layout shift
    return <div className="h-6 w-11 rounded-full bg-muted animate-pulse" />;
  }
  
  const isDark = theme === 'dark';

  const toggleTheme = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return <Switch id="theme-switch" checked={isDark} onCheckedChange={toggleTheme} />;
}
