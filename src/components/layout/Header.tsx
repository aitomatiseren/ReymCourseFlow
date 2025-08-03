
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, Settings, LogOut, Calendar, BookOpen, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '@/context/PermissionsContext';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { SearchDialog } from '@/components/layout/SearchDialog';
import { clearAuthSession } from '@/utils/sessionUtils';
import { useEmployees } from '@/hooks/useEmployees';
import { useTrainings } from '@/hooks/useTrainings';
import { useCourses } from '@/hooks/useCourses';

export const Header: React.FC = () => {
  const { t } = useTranslation(['common', 'auth']);
  const { userProfile, isAdmin, roleName } = usePermissions();
  const { unreadCount } = useNotifications(userProfile?.employee?.id);
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [basicSearchQuery, setBasicSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { state } = useSidebar();

  // Get data for live search
  const { data: employees = [] } = useEmployees();
  const { data: trainings = [] } = useTrainings();
  const { data: courses = [] } = useCourses();

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

  // Filter search results
  const filteredEmployees = employees.filter(employee =>
    basicSearchQuery.trim() && (
      employee.name.toLowerCase().includes(basicSearchQuery.toLowerCase()) ||
      employee.email?.toLowerCase().includes(basicSearchQuery.toLowerCase()) ||
      employee.employeeNumber?.toLowerCase().includes(basicSearchQuery.toLowerCase())
    )
  ).slice(0, 3);

  const filteredTrainings = trainings.filter(training =>
    basicSearchQuery.trim() && (
      training.title.toLowerCase().includes(basicSearchQuery.toLowerCase()) ||
      training.instructor?.toLowerCase().includes(basicSearchQuery.toLowerCase())
    )
  ).slice(0, 3);

  const filteredCourses = courses.filter(course =>
    basicSearchQuery.trim() && (
      course.title.toLowerCase().includes(basicSearchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(basicSearchQuery.toLowerCase())
    )
  ).slice(0, 3);

  const hasResults = filteredEmployees.length > 0 || filteredTrainings.length > 0 || filteredCourses.length > 0;

  // Handle clicking outside search area
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBasicSearchQuery(value);
    setShowSearchResults(value.trim().length > 0);
  };

  // Handle result clicks
  const handleEmployeeClick = (employeeId: string) => {
    navigate(`/participants/${employeeId}`);
    setBasicSearchQuery('');
    setShowSearchResults(false);
  };

  const handleTrainingClick = (trainingId: string) => {
    navigate(`/scheduling?training=${trainingId}`);
    setBasicSearchQuery('');
    setShowSearchResults(false);
  };

  const handleCourseClick = (courseId: string) => {
    navigate(`/courses/${courseId}`);
    setBasicSearchQuery('');
    setShowSearchResults(false);
  };

  // Global keydown event listener for search shortcut
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'K') {
      e.preventDefault();
      setSearchOpen(true);
    }
  };

  const handleBasicSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && basicSearchQuery.trim()) {
      // Open advanced search with the basic query
      setSearchOpen(true);
    }
    // Ctrl+Shift+K still opens advanced search
    if (e.ctrlKey && e.shiftKey && e.key === 'K') {
      e.preventDefault();
      setSearchOpen(true);
    }
  };

  // Clear basic search when advanced search closes
  const handleAdvancedSearchClose = (open: boolean) => {
    setSearchOpen(open);
    if (!open) {
      setBasicSearchQuery('');
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
      <header className="fixed top-0 right-0 z-[60] bg-white border-b border-gray-200 px-4 py-4 h-16 flex items-center overflow-visible"
              style={{ 
                left: state === "expanded" ? "var(--sidebar-width)" : "var(--sidebar-width-icon)",
                "--sidebar-width": "12rem",
                "--sidebar-width-icon": "4rem"
              }}>
        <div className="flex items-center justify-between w-full overflow-visible">
          <div className="flex items-center space-x-4">
            <SidebarTrigger className="ml-0" />

            <div className="flex items-center space-x-3 overflow-visible">
              <div ref={searchRef} className="relative overflow-visible">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                <Input
                  placeholder={t('common:header.searchPlaceholder')}
                  className="pl-10 w-[500px] relative"
                  value={basicSearchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleBasicSearchKeyDown}
                  onFocus={() => basicSearchQuery.trim() && setShowSearchResults(true)}
                />
                
                {/* Live Search Results Dropdown */}
                {showSearchResults && basicSearchQuery.trim() && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                    {hasResults ? (
                      <div className="p-2">
                        {/* Employees */}
                        {filteredEmployees.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-xs font-medium text-gray-500 mb-1 px-2">Employees</h4>
                            {filteredEmployees.map((employee) => (
                              <button
                                key={employee.id}
                                onClick={() => handleEmployeeClick(employee.id)}
                                className="w-full text-left p-2 hover:bg-gray-50 rounded flex items-center space-x-2"
                              >
                                <User className="h-4 w-4 text-gray-400" />
                                <div>
                                  <div className="font-medium text-sm">{employee.name}</div>
                                  <div className="text-xs text-gray-500">{employee.jobTitle} • {employee.employeeNumber}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Trainings */}
                        {filteredTrainings.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-xs font-medium text-gray-500 mb-1 px-2">Trainings</h4>
                            {filteredTrainings.map((training) => (
                              <button
                                key={training.id}
                                onClick={() => handleTrainingClick(training.id)}
                                className="w-full text-left p-2 hover:bg-gray-50 rounded flex items-center space-x-2"
                              >
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <div>
                                  <div className="font-medium text-sm">{training.title}</div>
                                  <div className="text-xs text-gray-500">{training.date} • {training.instructor}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Courses */}
                        {filteredCourses.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-xs font-medium text-gray-500 mb-1 px-2">Courses</h4>
                            {filteredCourses.map((course) => (
                              <button
                                key={course.id}
                                onClick={() => handleCourseClick(course.id)}
                                className="w-full text-left p-2 hover:bg-gray-50 rounded flex items-center space-x-2"
                              >
                                <BookOpen className="h-4 w-4 text-gray-400" />
                                <div>
                                  <div className="font-medium text-sm">{course.title}</div>
                                  <div className="text-xs text-gray-500">{course.description}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Show more link */}
                        <button
                          onClick={() => {
                            setSearchOpen(true);
                            setShowSearchResults(false);
                          }}
                          className="w-full text-left p-2 text-blue-600 hover:bg-blue-50 rounded text-sm border-t"
                        >
                          View all results in Advanced Search →
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No results found for "{basicSearchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={handleSearchClick}
                className="flex items-center space-x-1"
              >
                <Search className="h-3 w-3" />
                <span>Advanced</span>
              </Button>
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

      <SearchDialog 
        open={searchOpen} 
        onOpenChange={handleAdvancedSearchClose} 
        initialQuery={basicSearchQuery}
      />
    </>
  );
}
