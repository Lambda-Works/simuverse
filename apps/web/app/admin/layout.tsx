"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminProvider, useAdmin } from "@/lib/admin-context";
import { AdminSidebar } from "@/components/AdminSidebar";

function AdminSidebarWrapper() {
  const { currentTab, setCurrentTab, pendingCount } = useAdmin();
  return (
    <AdminSidebar
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      pendingCount={pendingCount}
    />
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <SidebarProvider>
        <AdminSidebarWrapper />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </AdminProvider>
  );
}
