import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import { User } from "@/entities/all";
import { qbank } from "@/configs";
import { BookOpen, LayoutDashboard, BarChart3, Clock, Crown, LogOut, MessageSquare, History } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import TrialCounter from "./components/common/TrialCounter";

const navigationItems = [
  { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
  { title: "Study", url: createPageUrl("Study"), icon: BookOpen },
  { title: "Practice Tests", url: createPageUrl("PracticeTests"), icon: Clock },
  { title: "Progress", url: createPageUrl("Analytics"), icon: BarChart3 },
  { title: "Test History", url: createPageUrl("TestHistory"), icon: History },
];

export default function Layout({ children }) {
  const location = useLocation();
  const { logout } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  useEffect(() => { User.me().then(setUserProfile).catch(() => {}); }, []);

  const handleLogout = async () => { await logout(); window.location.href = '/auth'; };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <Sidebar className="border-r border-slate-200/60">
          <SidebarHeader className="border-b border-slate-200/60 p-4 md:p-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 bg-gradient-to-br from-${qbank.colors.primary}-600 to-${qbank.colors.accent}-500 rounded-lg flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">{qbank.logoText}</span>
                </div>
                <span className="font-bold text-lg text-slate-900">{qbank.name}</span>
              </div>
              <TrialCounter user={userProfile} />
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2 md:p-3">
            <SidebarGroup><SidebarGroupContent><SidebarMenu>
              {navigationItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className={`hover:bg-blue-50 hover:text-blue-700 transition-all rounded-xl mb-1 ${location.pathname === item.url ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-sm border-l-4 border-blue-600' : 'text-slate-600'}`}>
                    <Link to={item.url} className="flex items-center gap-3 px-3 md:px-4 py-3"><item.icon className="w-5 h-5 flex-shrink-0" /><span className="font-medium text-sm md:text-base">{item.title}</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu></SidebarGroupContent></SidebarGroup>

            {userProfile?.subscription_status === 'trial' && (
              <SidebarGroup className="mt-auto"><SidebarGroupContent>
                <Link to={createPageUrl("Upgrade")}><div className="mx-3 p-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl text-white hover:shadow-lg transition-shadow cursor-pointer"><div className="flex items-center gap-2 mb-2"><Crown className="w-5 h-5" /><span className="font-bold">Upgrade to Premium</span></div><p className="text-xs text-white/90">Unlimited questions & full access</p></div></Link>
              </SidebarGroupContent></SidebarGroup>
            )}

            <SidebarGroup className="mt-4"><SidebarGroupContent>
              <Link to={createPageUrl("Chatbot")}><div className="mx-3 p-3 bg-white border-2 border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"><div className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-blue-600" /><span className="font-semibold text-slate-900 text-sm">AI Chatbot</span></div><p className="text-xs text-slate-600 mt-1">24/7 Expert Help</p></div></Link>
            </SidebarGroupContent></SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-slate-200/60 p-3 md:p-4">
            <DropdownMenu><DropdownMenuTrigger className="w-full"><div className="flex items-center gap-3 hover:bg-slate-100 p-2 rounded-lg transition-colors"><div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-white font-semibold text-sm">{userProfile?.full_name?.charAt(0) || 'U'}</span></div><div className="flex-1 min-w-0 text-left"><p className="font-medium text-slate-900 text-sm truncate">{userProfile?.full_name || 'User'}</p><p className="text-xs text-slate-500 truncate">{userProfile?.email}</p></div></div></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56"><DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer"><LogOut className="w-4 h-4 mr-2" />Logout</DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 flex flex-col min-w-0">
          <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-4 py-3 md:hidden sticky top-0 z-10"><div className="flex items-center justify-between gap-4"><SidebarTrigger /><TrialCounter user={userProfile} /></div></header>
          <div className="flex-1 overflow-auto">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
