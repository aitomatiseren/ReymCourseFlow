
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


  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-visible">
          <Header />
          <main className="flex-1 p-6 pt-20 overflow-visible">
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
