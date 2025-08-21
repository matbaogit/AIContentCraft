import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/providers/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/common/ThemeSwitcher";
import { ScrollIcon } from "lucide-react";
import { SidebarMenuItem } from "@shared/schema";
import {
  LayoutDashboard,
  PenSquare,
  FileText,
  Coins,
  Package,
  Link2,
  Settings,
  LogOut,
  Key,
  Users,
  Database,
  BarChart3,
  Globe,
  Image,
  Images,
  MessageSquare,
  Bell,
  Calendar,
  Clock,
  Share2,
  TrendingUp,
  History,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

// Icon mapping for dynamic menu items
const getIconComponent = (iconName: string | null) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    'LayoutDashboard': <LayoutDashboard className="h-5 w-5 mr-3" />,
    'PenSquare': <PenSquare className="h-5 w-5 mr-3" />,
    'PenTool': <PenSquare className="h-5 w-5 mr-3" />,
    'FileText': <FileText className="h-5 w-5 mr-3" />,
    'Share2': <Share2 className="h-5 w-5 mr-3" />,
    'BookOpen': <FileText className="h-5 w-5 mr-3" />,
    'Image': <Image className="h-5 w-5 mr-3" />,
    'ImagePlus': <Image className="h-5 w-5 mr-3" />,
    'Calendar': <Calendar className="h-5 w-5 mr-3" />,
    'Link': <Link2 className="h-5 w-5 mr-3" />,
    'Key': <Key className="h-5 w-5 mr-3" />,
    'Bot': <Settings className="h-5 w-5 mr-3" />,
    'Palette': <Settings className="h-5 w-5 mr-3" />,
    'Split': <Database className="h-5 w-5 mr-3" />,
    'Coins': <Coins className="h-5 w-5 mr-3" />,
    'History': <History className="h-5 w-5 mr-3" />,
    'Settings': <Settings className="h-5 w-5 mr-3" />,
  };
  
  return iconMap[iconName || ''] || <FileText className="h-5 w-5 mr-3" />;
};

export function Sidebar() {
  const { t, language } = useLanguage();
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  
  // Fetch dynamic menu items from admin configuration
  const { data: menuItemsResponse, isLoading: isLoadingMenuItems } = useQuery<{success: boolean, data: SidebarMenuItem[]}>({
    queryKey: ["/api/sidebar-menu"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const menuItems = menuItemsResponse?.data || [];
  
  // Lấy thông tin người dùng từ user object
  // Phát hiện nếu user là một đối tượng có data trong nó (từ API response)
  const userData = user && typeof user === 'object' && 'data' in user ? user.data : user;

  // Convert dynamic menu items to sidebar links
  const links: SidebarLink[] = menuItems.map(item => ({
    href: item.path || "#",
    label: language === "vi" ? item.label : (item.labelEn || item.label),
    icon: getIconComponent(item.icon)
  }));

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Debug logging
  console.log('Sidebar render:', { userData, menuItems: menuItems.length });

  return (
    <div className="w-64 bg-sidebar dark:bg-card h-screen flex flex-col fixed left-0 top-0 z-10">
      <div className="p-4 flex items-center border-b border-sidebar-border dark:border-border">
        <ScrollIcon className="h-8 w-auto text-white dark:text-secondary-100" />
        <span className="ml-2 font-bold dark:text-secondary-100 font-heading text-[28px] text-[#ffffff]">
          {t("common.appName")}
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto pt-5 pb-20">
        <ul className="space-y-1 px-2">
          {links.map((link) => (
            <li key={link.href}>
              <Link 
                href={link.href}
                className="flex items-center py-3 px-4 rounded-md text-sm transition-colors dark:text-white font-semibold hover:text-[#084d91] dark:hover:text-white hover:bg-sidebar-accent/50 dark:hover:bg-primary-900/50 text-[#ffffff]"
              >
                {link.icon}
                {link.label}
              </Link>
            </li>
          ))}

          
          {/* Tạo thủ công một component Link đến trang Admin dựa vào role */}
          {(() => {
            // Kiểm tra nếu user có tồn tại và có role là admin
            const isAdmin = 
              userData && 
              typeof userData === 'object' && 
              'role' in userData && 
              (userData as any).role === "admin";
            
            // Log thông tin để debug
            console.log("Is admin?", isAdmin, "User role:", (userData as any)?.role);
            
            // Chỉ hiện menu quản trị cho admin
            if (isAdmin) {
              return (
                <li>
                  <Link 
                    href="/admin"
                    className="flex items-center py-3 px-4 rounded-md text-sm font-semibold transition-colors text-white dark:text-white hover:text-white dark:hover:text-white hover:bg-sidebar-accent/50 dark:hover:bg-primary-900/50"
                  >
                    <LayoutDashboard className="h-5 w-5 mr-3" />
                    {t("admin.adminPanel")}
                  </Link>
                </li>
              );
            }
            
            // Không trả về gì nếu không phải admin
            return null;
          })()}
        </ul>
      </nav>
      <div className="p-4 border-t border-sidebar-border dark:border-border mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.fullName || user?.username}&background=random`} />
              <AvatarFallback>
                {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-white dark:text-secondary-100">
                {user?.fullName || user?.username}
              </p>
              <button
                onClick={handleLogout}
                className="text-xs text-white font-semibold dark:text-white hover:text-white dark:hover:text-white flex items-center mt-1"
              >
                <LogOut className="h-3 w-3 mr-1" />
                {t("common.logout")}
              </button>
            </div>
          </div>
          <ThemeSwitcher variant="icon" className="text-white dark:text-white hover:text-white dark:hover:text-white" />
        </div>
      </div>
    </div>
  );
}
