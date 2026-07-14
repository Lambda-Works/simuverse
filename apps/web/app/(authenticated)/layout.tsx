import { AppSidebar } from '@/components/AppSidebar';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AdminReadOnlyProvider } from '@/lib/admin-context';
import { SidebarHeaderProvider } from '@/lib/sidebar-header-context';

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
