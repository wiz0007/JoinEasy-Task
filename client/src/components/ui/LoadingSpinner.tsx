import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-2">
      <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      <span className="text-xs font-medium text-muted-text">{message}</span>
    </div>
  );
};
