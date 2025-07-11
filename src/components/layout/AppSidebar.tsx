
import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  BookOpen, 
  Users, 
  Award, 
  Building2, 
  MessageSquare, 
  Settings, 
  Calendar,
  FileText,
  Bell,
  User
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Courses", url: "/courses", icon: BookOpen },
  { title: "Participants", url: "/participants", icon: Users },
  { title: "Certifications", url: "/certifications", icon: Award },
  { title: "Training Scheduler", url: "/scheduling", icon: Calendar },
  { title: "Employee Portal", url: "/employee-dashboard", icon: User },
  { title: "Providers", url: "/providers", icon: Building2 },
  { title: "Notifications", url: "/communications", icon: Bell },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();

  return (
    <Sidebar 
      className="border-r"
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border h-16">
        <div className="flex items-center justify-between h-full px-4">
          {state === "expanded" && (
            <div>
              <h2 className="text-xl font-bold text-blue-400">CourseFlow</h2>
              <p className="text-xs text-muted-foreground">Management System</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <NavLink to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-white">RB</span>
            </div>
            {state === "expanded" && (
              <div>
                <p className="text-sm font-medium">Reym B.V.</p>
                <p className="text-xs text-muted-foreground">Admin User</p>
              </div>
            )}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
