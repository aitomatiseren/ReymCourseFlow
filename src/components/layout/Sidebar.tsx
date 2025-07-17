import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  BookOpen, 
  Users, 
  Award, 
  Building2, 
  MessageSquare, 
  Settings, 
  ChevronLeft,
  Calendar,
  FileText,
  Bell,
  User,
  Clock,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Courses", url: "/courses", icon: BookOpen },
  { title: "Participants", url: "/participants", icon: Users },
  { title: "Certificate Definitions", url: "/certificate-definitions", icon: Award },
  { title: "Certificate Expiry", url: "/certificate-expiry", icon: Clock },
  { title: "Training Scheduler", url: "/scheduling", icon: Calendar },
  { title: "Employee Portal", url: "/employee-dashboard", icon: User },
  { title: "Providers", url: "/providers", icon: Building2 },
  { title: "Notifications", url: "/communications", icon: Bell },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside className={cn(
      "bg-slate-900 text-white transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h2 className="text-xl font-bold text-blue-400">CourseFlow</h2>
              <p className="text-xs text-slate-400">Management System</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <li key={item.title}>
                <NavLink
                  to={item.url}
                  className={cn(
                    "flex items-center p-3 rounded-lg transition-colors group",
                    isActive 
                      ? "bg-blue-600 text-white" 
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="ml-3 font-medium">{item.title}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "")}>
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold">RB</span>
          </div>
          {!collapsed && (
            <div className="ml-3">
              <p className="text-sm font-medium">Reym B.V.</p>
              <p className="text-xs text-slate-400">Admin User</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
