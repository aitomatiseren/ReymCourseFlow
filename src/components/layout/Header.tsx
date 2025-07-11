
import React, { useState, useEffect } from "react";
import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SearchDialog } from "./SearchDialog";

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearchClick = () => {
    setSearchOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'K' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setSearchOpen(true);
    }
  };

  // Add global keydown listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'K' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

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
                placeholder="Search courses, participants, trainings... (Ctrl+Shift+K)"
                className="pl-10 w-96 cursor-pointer"
                onClick={handleSearchClick}
                onKeyDown={handleKeyDown}
                readOnly
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </Button>
            
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
