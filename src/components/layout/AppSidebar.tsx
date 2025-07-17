
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
  User,
  Wrench,
  Shield,
  PenTool
} from "lucide-react";
import { useTranslation } from "react-i18next";
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

const getMenuItems = (t: (key: string) => string) => [
  { titleKey: "navigation.dashboard", url: "/", icon: Home, permissions: [] },
  { titleKey: "navigation.trainingSetup", url: "/training-setup", icon: Wrench, permissions: ["view_courses"] },
  { titleKey: "navigation.participants", url: "/participants", icon: Users, permissions: ["view_employees"] },
  { titleKey: "navigation.trainingScheduler", url: "/scheduling", icon: Calendar, permissions: ["view_schedules"] },
  { titleKey: "navigation.preliminaryPlanning", url: "/preliminary-planning", icon: PenTool, permissions: ["view_schedules"] },
  { titleKey: "navigation.employeePortal", url: "/employee-dashboard", icon: User, permissions: ["view_own_profile"] },
  { titleKey: "navigation.notifications", url: "/communications", icon: Bell, permissions: [] },
  { titleKey: "navigation.reports", url: "/reports", icon: FileText, permissions: ["view_basic_reports"] },
  { titleKey: "navigation.settings", url: "/settings", icon: Settings, permissions: ["manage_system_settings"] },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const { hasAnyPermission, isAdmin } = usePermissions();
  const { t } = useTranslation('common');

  const menuItems = getMenuItems(t);

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
                const hasPermission = isAdmin || item.permissions.length === 0 || hasAnyPermission(item.permissions as string[]);
                if (!hasPermission) return null;

                const isActive = location.pathname === item.url;
                const title = t(item.titleKey);
                return (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={title}>
                      <NavLink to={item.url}>
                        <item.icon />
                        <span>{title}</span>
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
