
import React, { useState } from 'react';
import { Bell, Search, User, Settings, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '@/context/PermissionsContext';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { SearchDialog } from '@/components/layout/SearchDialog';
import { clearAuthSession } from '@/utils/sessionUtils';

export const Header: React.FC = () => {
  const { t } = useTranslation(['common', 'auth']);
  const { userProfile, isAdmin, roleName } = usePermissions();
  const { unreadCount } = useNotifications(userProfile?.employee?.id);
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLogout = async () => {
    try {
      // Clear all authentication data first
      clearAuthSession();

      // Sign out from Supabase (this may fail but we continue)
      const { error } = await supabase.auth.signOut();
      if (error && error.name !== 'AuthSessionMissingError') {
        console.error('Supabase signout error (continuing anyway):', error);
      }

      // Force hard reload to clear all state and prevent auto-login
      toast.success(t('common:header.logoutSuccess'));
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      // Even on error, clear storage and redirect
      clearAuthSession();
      window.location.href = '/login';
    }
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleSearchClick = () => {
    setSearchOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'K') {
      e.preventDefault();
      setSearchOpen(true);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    // For users with employee records
    if (userProfile?.employee?.name) {
      return userProfile.employee.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }

    // For system users without employee records, use role-based initials
    if (isAdmin) {
      return 'AD';
    }

    return 'U';
  };

  // Get display name
  const getDisplayName = () => {
    // For users with employee records
    if (userProfile?.employee?.name) {
      return userProfile.employee.name;
    }

    // For system users without employee records
    if (isAdmin) {
      return t('common:header.systemAdministrator');
    }

    return t('common:header.user');
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 py-4 h-16 flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <SidebarTrigger className="ml-0" />

            <img
              src="/lovable-uploads/ac9dfd50-16e3-40fc-bd96-7722cc5e2bb9.png"
              alt="Company Logo"
              className="h-8 w-8"
            />

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t('common:header.searchPlaceholder')}
                className="pl-10 w-[500px] cursor-pointer"
                onClick={handleSearchClick}
                onKeyDown={handleKeyDown}
                readOnly
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <NotificationBell userId={userProfile?.employee?.id} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-sm">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {getDisplayName()}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {roleName ? `${t('common:header.role')}: ${roleName}` : t('common:header.notAuthenticated')}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSettings}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t('common:header.settings')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('common:header.logOut')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
