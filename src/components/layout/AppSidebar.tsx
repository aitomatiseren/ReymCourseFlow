
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
import { usePermissions } from "@/context/PermissionsContext";
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
  { title: "Dashboard", url: "/", icon: Home, permissions: [] },
  { title: "Courses", url: "/courses", icon: BookOpen, permissions: ["view_courses"] },
  { title: "Participants", url: "/participants", icon: Users, permissions: ["view_employees"] },
  { title: "Certifications", url: "/certifications", icon: Award, permissions: ["view_own_certificates"] },
  { title: "Training Scheduler", url: "/scheduling", icon: Calendar, permissions: ["view_schedules"] },
  { title: "Employee Portal", url: "/employee-dashboard", icon: User, permissions: ["view_own_profile"] },
  { title: "Providers", url: "/providers", icon: Building2, permissions: ["view_courses"] },
  { title: "Notifications", url: "/communications", icon: Bell, permissions: [] },
  { title: "Reports", url: "/reports", icon: FileText, permissions: ["view_basic_reports"] },
  { title: "Settings", url: "/settings", icon: Settings, permissions: ["manage_system_settings"] },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const { hasAnyPermission, isAdmin } = usePermissions();

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
                // Check if user has permission to see this menu item
                // Admin users can see everything, others need specific permissions
                const hasPermission = isAdmin || item.permissions.length === 0 || hasAnyPermission(item.permissions as any);
                if (!hasPermission) return null;

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
    </Sidebar>
  );
}
