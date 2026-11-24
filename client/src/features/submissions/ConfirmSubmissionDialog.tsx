import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api.js';
import { Dialog } from '../../components/ui/Dialog.js';
import { Button } from '../../components/ui/Button.js';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export interface ConfirmSubmissionDialogProps {
  assignmentId: string;
  assignmentTitle: string;
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ConfirmSubmissionDialog: React.FC<ConfirmSubmissionDialogProps> = ({
  assignmentId,
  assignmentTitle,
  groupId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest(`/assignments/${assignmentId}/groups/${groupId}/confirm`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupProgress'] });
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['myGroup'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['assignmentAnalytics'] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to confirm submission');
    },
  });

  const handleConfirm = () => {
    setErrorMsg(null);
    mutation.mutate();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Confirm Assignment Submission">
      <div className="space-y-4">
        {errorMsg && (
          <div className="rounded-md bg-red-50 p-2.5 text-xs text-red-700 border border-red-200 flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="rounded-md bg-slate-50 p-4 border border-border/80 text-xs text-main-text space-y-2">
          <p className="font-semibold text-sm text-main-text">{assignmentTitle}</p>
          <p className="text-muted-text">
            By confirming, you verify on behalf of your group that your completed work has been uploaded to the external OneDrive submission link.
          </p>
          <p className="text-[11px] text-amber-700 font-medium bg-amber-50 p-2 rounded border border-amber-200">
            Note: This confirmation will be permanently recorded with your name and current timestamp for your group.
          </p>
        </div>

        <div className="flex justify-end space-x-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            isLoading={mutation.isPending}
            icon={<CheckCircle2 className="h-4 w-4" />}
          >
            Confirm Submission
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
