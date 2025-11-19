
'use client';

import * as React from 'react';
import {
  Dialog as DesktopDialog,
  DialogContent as DesktopDialogContent,
  DialogDescription as DesktopDialogDescription,
  DialogHeader as DesktopDialogHeader,
  DialogTitle as DesktopDialogTitle,
  DialogFooter as DesktopDialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const ResponsiveDialog = ({ children, ...props }: ResponsiveDialogProps) => {
  const isMobile = useIsMobile();
  const DialogComponent = isMobile ? Drawer : DesktopDialog;

  return <DialogComponent {...props}>{children}</DialogComponent>;
};

const ResponsiveDialogContent = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DesktopDialogContent>) => {
  const isMobile = useIsMobile();
  const DialogContentComponent = isMobile ? DrawerContent : DesktopDialogContent;
  
  // Mobile drawer has its own scrolling, so we can wrap content in a scroll area
  if (isMobile) {
    return (
      <DrawerContent {...props} className={className}>
        <div className="overflow-y-auto max-h-[80vh] p-4">
          {children}
        </div>
      </DrawerContent>
    )
  }

  return (
    <DesktopDialogContent {...props} className={className}>
      {children}
    </DesktopDialogContent>
  );
};


const ResponsiveDialogHeader = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DesktopDialogHeader>) => {
  const isMobile = useIsMobile();
  const HeaderComponent = isMobile ? DrawerHeader : DesktopDialogHeader;
  return (
    <HeaderComponent {...props} className={className}>
      {children}
    </HeaderComponent>
  );
};

const ResponsiveDialogFooter = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DesktopDialogFooter>) => {
  const isMobile = useIsMobile();
  const FooterComponent = isMobile ? DrawerFooter : DesktopDialogFooter;
  return (
    <FooterComponent {...props} className={className}>
      {children}
    </FooterComponent>
  );
};

const ResponsiveDialogTitle = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DesktopDialogTitle>) => {
  const isMobile = useIsMobile();
  const TitleComponent = isMobile ? DrawerTitle : DesktopDialogTitle;
  return (
    <TitleComponent {...props} className={className}>
      {children}
    </TitleComponent>
  );
};

const ResponsiveDialogDescription = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DesktopDialogDescription>) => {
  const isMobile = useIsMobile();
  const DescriptionComponent = isMobile
    ? DrawerDescription
    : DesktopDialogDescription;
  return (
    <DescriptionComponent {...props} className={className}>
      {children}
    </DescriptionComponent>
  );
};

export {
  ResponsiveDialog as Dialog,
  DialogTrigger,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogFooter as DialogFooter,
  ResponsiveDialogTitle as DialogTitle,
  ResponsiveDialogDescription as DialogDescription,
  DialogClose,
  DrawerClose
};
