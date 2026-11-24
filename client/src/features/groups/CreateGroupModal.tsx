import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api.js';
import { Dialog } from '../../components/ui/Dialog.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { useAuth } from '../auth/AuthContext.js';

const schema = z.object({
  name: z.string().trim().min(2, 'Group name must be at least 2 characters').max(100),
});

type FormValues = z.infer<typeof schema>;

export interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();
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
      apiRequest('/groups', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: async () => {
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['myGroup'] });
      reset();
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to create group');
    },
  });

  const onSubmit = (data: FormValues) => {
    setErrorMsg(null);
    mutation.mutate(data);
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Create New Group">
      {errorMsg && (
        <div className="mb-4 rounded-md bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Group Name"
          placeholder="e.g. Algorithms Team Alpha"
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            Create Group
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
