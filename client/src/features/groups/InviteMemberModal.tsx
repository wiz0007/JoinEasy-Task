import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api.js';
import { Dialog } from '../../components/ui/Dialog.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';

const schema = z.object({
  identifier: z.string().trim().min(1, 'Email or student ID is required'),
});

type FormValues = z.infer<typeof schema>;

export interface InviteMemberModalProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  groupId,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      apiRequest(`/groups/${groupId}/invitations`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGroup'] });
      reset();
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to send invitation');
    },
  });

  const onSubmit = (data: FormValues) => {
    setErrorMsg(null);
    mutation.mutate(data);
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Invite Student">
      {errorMsg && (
        <div className="mb-4 rounded-md bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Student Email or Student ID"
          placeholder="e.g. student@joineazy.edu or STU-002"
          error={errors.identifier?.message}
          {...register('identifier')}
        />

        <div className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            Send Invitation
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
