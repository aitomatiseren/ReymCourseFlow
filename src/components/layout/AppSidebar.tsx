
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
  PenTool,
  StickyNote
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
  { titleKey: "navigation.personalNotes", url: "/personal-notes", icon: StickyNote, permissions: [] },
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
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border h-16">
        <div className={`flex items-center justify-center h-full transition-all duration-200 ease-linear ${state === "expanded" ? "px-4" : "px-1"}`}>
          {state === "expanded" ? (
            <div className="flex items-center space-x-3 transition-all duration-200 ease-linear">
              <h2 className="text-xl font-bold text-red-500 whitespace-nowrap transition-all duration-200 ease-linear origin-left opacity-100 scale-x-100 translate-x-0">
                CourseFlow
              </h2>
              <img
                src="/lovable-uploads/ac9dfd50-16e3-40fc-bd96-7722cc5e2bb9.png"
                alt="Company Logo"
                className="h-8 w-auto max-w-[2rem] object-contain transition-all duration-200 ease-linear"
              />
            </div>
          ) : (
            <img
              src="/lovable-uploads/ac9dfd50-16e3-40fc-bd96-7722cc5e2bb9.png"
              alt="Company Logo"
              className="h-8 w-auto object-contain transition-all duration-200 ease-linear"
            />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:items-center">
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
            <SidebarMenu className="group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
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
                      <NavLink to={item.url} className="transition-all duration-200 ease-linear">
                        <item.icon className="flex-shrink-0 transition-all duration-200 ease-linear" />
                        <span className={`transition-all duration-200 ease-linear ${
                          state === "collapsed" ? "opacity-0 max-w-0 overflow-hidden ml-0" : "opacity-100 max-w-none ml-2"
                        }`}>
                          {title}
                        </span>
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
