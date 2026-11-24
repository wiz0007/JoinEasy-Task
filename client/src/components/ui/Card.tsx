import React from 'react';
import { cn } from '../../lib/utils.js';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className, title, action, children, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md',
        className
      )}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between pb-4 border-b border-border/60 mb-4">
          {title && <h3 className="text-base font-semibold text-main-text">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
