import React from 'react';
import { cn } from '../../lib/utils.js';

export interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  submitted?: number;
  pending?: number;
  overdue?: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  submitted,
  pending,
  overdue,
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div className={cn('w-full space-y-2', className)}>
      <div className="flex items-center justify-between text-xs font-semibold text-main-text">
        <span>{label || 'Completion Progress'}</span>
        <span className="text-brand-500 font-bold">{percentage}%</span>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 border border-border/80">
        <div
          className="h-full bg-brand-500 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {(submitted !== undefined || pending !== undefined || overdue !== undefined) && (
        <div className="flex items-center space-x-3 text-[11px] text-muted-text pt-0.5">
          {submitted !== undefined && (
            <span className="flex items-center">
              <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5" />
              {submitted} Submitted
            </span>
          )}
          {pending !== undefined && (
            <span className="flex items-center">
              <span className="h-2 w-2 rounded-full bg-amber-500 mr-1.5" />
              {pending} Pending
            </span>
          )}
          {overdue !== undefined && (
            <span className="flex items-center">
              <span className="h-2 w-2 rounded-full bg-red-500 mr-1.5" />
              {overdue} Overdue
            </span>
          )}
        </div>
      )}
    </div>
  );
};
