import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { useSocket } from '../../app/SocketContext';
import { useTheme } from '../../app/ThemeContext';
import {
  LayoutDashboard,
  CheckSquare,
  LogOut,
  Bell,
  Sun,
  Menu,
  X,
  Video,
  Sparkles
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useSocket();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Kanban Tasks', path: '/tasks', icon: CheckSquare },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fafafa] text-slate-800 font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#f8fafc] border-r border-[#e2e8f0] p-6 space-y-6 shrink-0">
        {/* Brand */}
        <div className="flex items-center space-x-3 pb-6 border-b border-[#e2e8f0]">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
            <Video className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none">IntellMeet</h1>
            <span className="text-[9px] text-blue-600 font-bold uppercase tracking-wider">AI Platform</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-white border border-[#e2e8f0] text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile card & Logout */}
        <div className="pt-6 border-t border-[#e2e8f0] flex flex-col space-y-4">
          <div className="flex items-center space-x-3">
            <img
              src={user?.avatarUrl}
              alt={user?.username}
              className="w-9 h-9 rounded-full border border-slate-200 bg-white"
            />
            <div className="overflow-hidden text-left">
              <h4 className="text-xs font-bold truncate text-slate-900">{user?.username}</h4>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center space-x-2 w-full px-3 py-2 rounded-xl border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-500 text-xs font-semibold transition-all duration-150 cursor-pointer bg-white"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-[#e2e8f0] z-20">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Video className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm text-slate-900">IntellMeet</span>
        </div>
        <div className="flex items-center space-x-3">
          {/* Notification Button */}
          <button
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
            )}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-10 flex">
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-white border-r border-[#e2e8f0] h-full p-6 space-y-6 z-20">
            <div className="flex items-center justify-between pb-6 border-b border-[#e2e8f0]">
              <span className="font-bold text-sm text-slate-900">Navigation</span>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="pt-6 border-t border-[#e2e8f0] flex flex-col space-y-4">
              <div className="flex items-center space-x-3">
                <img
                  src={user?.avatarUrl}
                  alt={user?.username}
                  className="w-9 h-9 rounded-full border border-slate-200 bg-slate-50"
                />
                <div className="text-left">
                  <h4 className="text-xs font-bold text-slate-900">{user?.username}</h4>
                  <p className="text-[10px] text-slate-400">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center space-x-2 w-full px-3 py-2 rounded-xl border border-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-500 text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col overflow-x-hidden min-h-0 bg-white">
        {/* Desktop Navbar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-[#e2e8f0] bg-white z-10 shrink-0">
          <div className="flex items-center space-x-3">
            <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wider">
              {location.pathname === '/dashboard' && 'AI Command Center'}
              {location.pathname === '/tasks' && 'Kanban Workspace'}
              {location.pathname.startsWith('/meeting') && 'Collaboration Suite'}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            {/* Ambient AI Indicator tag */}
            <div className="inline-flex items-center space-x-2 bg-purple-50 border border-purple-100 rounded-full px-2.5 py-1 text-[10px] font-bold text-purple-600 shadow-sm animate-pulse-glow">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gemini Engine Active</span>
            </div>

            {/* Static Theme indicator (sun style for clean light mode) */}
            <div className="p-2 rounded-xl bg-slate-100 text-amber-500" title="Light Mode Engaged">
              <Sun className="w-4 h-4" />
            </div>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-600 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              {notifDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-25" onClick={() => setNotifDropdownOpen(false)} />
                  <div className="absolute right-0 mt-3 w-80 bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-xl z-30 animate-fade-in text-slate-800 text-left">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                      <span className="font-bold text-xs text-slate-900">Notifications ({unreadCount})</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[10px] text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-[10px] text-slate-400 text-center py-4">No notifications.</p>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            onClick={() => {
                              markAsRead(notif._id);
                              if (notif.link) navigate(notif.link);
                              setNotifDropdownOpen(false);
                            }}
                            className={`p-2.5 rounded-xl cursor-pointer transition-colors text-[11px] border ${
                              notif.isRead
                                ? 'bg-transparent border-transparent text-slate-400'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-800'
                            }`}
                          >
                            <p className="font-semibold">{notif.content}</p>
                            <span className="text-[9px] text-slate-400 mt-1 block">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center space-x-2 pl-3 border-l border-slate-200">
              <img
                src={user?.avatarUrl}
                alt={user?.username}
                className="w-8 h-8 rounded-xl border border-slate-200 bg-white"
              />
              <span className="text-xs font-bold text-slate-700">{user?.username}</span>
            </div>
          </div>
        </header>

        {/* Content Box */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#fafafa]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
