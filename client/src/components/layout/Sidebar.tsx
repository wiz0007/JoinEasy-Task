import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext.js';
import {
  LayoutDashboard,
  Users,
  Mail,
  BookOpen,
  X,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { cn } from '../../lib/utils.js';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const navItems = isAdmin
    ? [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard },
        { label: 'Assignments', path: '/assignments', icon: BookOpen },
        { label: 'All Groups', path: '/admin/groups', icon: Users },
      ]
    : [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard },
        { label: 'My Group', path: '/groups', icon: Users },
        { label: 'Invitations', path: '/invitations', icon: Mail },
        { label: 'Assignments', path: '/assignments', icon: BookOpen },
      ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4 bg-white border-r border-border">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 py-3 mb-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-base shadow-sm">
              J
            </div>
            <span className="font-bold text-lg text-main-text tracking-tight">Joineazy</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded p-1 text-muted-text hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-500 font-semibold'
                    : 'text-muted-text hover:bg-slate-50 hover:text-main-text'
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User profile and logout */}
      <div className="border-t border-border pt-4 mt-auto">
        <div className="flex items-center space-x-3 px-2 py-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-main-text shrink-0">
            {user?.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-main-text truncate">{user?.name}</p>
            <div className="flex items-center space-x-1 text-[10px] text-muted-text">
              <UserCheck className="h-3 w-3" />
              <span>{user?.role}</span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex w-full items-center space-x-2 rounded-md px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block lg:w-64 lg:shrink-0 lg:fixed lg:inset-y-0 lg:z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 w-64 max-w-[80vw] bg-white shadow-xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
