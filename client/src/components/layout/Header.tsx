import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext.js';
import { Badge } from '../ui/Badge.js';

export interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, activeGroup } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-border bg-white px-4 sm:px-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Open sidebar"
          className="rounded p-1.5 text-muted-text hover:bg-slate-100 hover:text-main-text lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-main-text lg:hidden">Joineazy</span>
      </div>

      <div className="flex items-center space-x-3">
        {activeGroup && (
          <div className="hidden sm:flex items-center space-x-2 text-xs text-muted-text">
            <span>Group:</span>
            <span className="font-semibold text-main-text">{activeGroup.name}</span>
            <Badge variant="info">{activeGroup.role}</Badge>
          </div>
        )}

        <Badge variant={user?.role === 'ADMIN' ? 'warning' : 'default'}>
          {user?.role}
        </Badge>
      </div>
    </header>
  );
};
