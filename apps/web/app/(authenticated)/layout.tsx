import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarHeaderProvider } from '@/lib/sidebar-header-context';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarHeaderProvider>
      <SidebarProvider>
        <Sidebar>
          <AppSidebar />
        </Sidebar>
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </SidebarHeaderProvider>
  );
}
