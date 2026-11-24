import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed border-border bg-white my-4">
      {Icon && <Icon className="h-10 w-10 text-muted-text/60 mb-3" />}
      <p className="text-sm font-medium text-muted-text mb-4">{title}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
