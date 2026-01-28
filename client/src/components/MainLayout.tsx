import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { ADOLogo } from '@/components/ADOLogo';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

// Map routes to breadcrumb labels
const routeLabels: Record<string, string> = {
  '/': 'Home',
  '/statistics': 'Statistics',
  '/gantt': 'Timeline',
  '/projects/new': 'Create Project',
  '/time': 'Time Tracking',
  '/crew': 'Crew',
  '/adhoc': 'Ad-hoc Requests',
  '/profile': 'Profile',
  '/admin': 'Admin',
  '/budget': 'ADO Budget',
};

function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const breadcrumbs: { label: string; href?: string }[] = [];

  // Always start with Home
  if (pathname !== '/') {
    breadcrumbs.push({ label: 'Home', href: '/' });
  }

  // Handle specific routes
  if (pathname.startsWith('/projects/') && pathname !== '/projects/new') {
    breadcrumbs.push({ label: 'Projects', href: '/' });
    breadcrumbs.push({ label: 'Project Details' });
  } else if (pathname === '/projects/new') {
    breadcrumbs.push({ label: 'Projects', href: '/' });
    breadcrumbs.push({ label: 'Create Project' });
  } else if (routeLabels[pathname]) {
    breadcrumbs.push({ label: routeLabels[pathname] });
  } else if (pathname === '/') {
    breadcrumbs.push({ label: 'Home' });
  }

  return breadcrumbs;
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex h-screen max-h-screen flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <span key={index} className="flex items-center gap-2">
                    {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                    <BreadcrumbItem className={index < breadcrumbs.length - 1 ? 'hidden md:block' : ''}>
                      {crumb.href ? (
                        <BreadcrumbLink href={crumb.href}>
                          {crumb.label}
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </span>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="px-4">
            <ADOLogo className="h-8 w-auto text-foreground" />
          </div>
        </header>
        <div className="flex-1 overflow-auto bg-background p-4">
          <div className="flex flex-col gap-4">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
