import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarHeaderProvider } from '@/lib/sidebar-header-context';
import { AdminReadOnlyProvider } from '@/lib/admin-context';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarHeaderProvider>
      <SidebarProvider defaultOpen={false} style={{ "--sidebar-width-icon": "3.5rem" } as React.CSSProperties}>
        <AdminReadOnlyProvider>
          <Sidebar collapsible="icon">
            <AppSidebar />
          </Sidebar>
          <SidebarInset>{children}</SidebarInset>
        </AdminReadOnlyProvider>
      </SidebarProvider>
    </SidebarHeaderProvider>
  );
}
