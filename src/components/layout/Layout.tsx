
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";
import { Chat } from "@/components/chat";
import { NotificationPopup } from "@/components/notifications/NotificationPopup";
import { usePermissions } from "@/context/PermissionsContext";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { userProfile } = usePermissions();

  // Debug logging for user profile
  console.log('Layout: userProfile', userProfile);
  console.log('Layout: employee_id for notifications', userProfile?.employee?.id);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Header />
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
        <Chat />
        <NotificationPopup
          userId={userProfile?.employee?.id}
          enableRealTime={true}
          maxVisible={3}
          autoHideDuration={8000}
          position="top-right"
        />
      </div>
    </SidebarProvider>
  );
}
