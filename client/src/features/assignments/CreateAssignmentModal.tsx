import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api.js';
import { Dialog } from '../../components/ui/Dialog.js';
import { Input } from '../../components/ui/Input.js';
import { Textarea } from '../../components/ui/Textarea.js';
import { Select } from '../../components/ui/Select.js';
import { Button } from '../../components/ui/Button.js';

const schema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters'),
    description: z.string().trim().min(5, 'Description must be at least 5 characters'),
    dueDate: z.string().min(1, 'Due date is required'),
    oneDriveUrl: z
      .string()
      .trim()
      .regex(/^https:\/\/.+/i, 'OneDrive URL must be a valid HTTPS URL'),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
    targetType: z.enum(['ALL_STUDENTS', 'SELECTED_GROUP']),
    targetGroupIds: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (data.targetType === 'SELECTED_GROUP') {
        return Array.isArray(data.targetGroupIds) && data.targetGroupIds.length > 0;
      }
      return true;
    },
    {
      message: 'Select at least one target group',
      path: ['targetGroupIds'],
    }
  );

type FormValues = z.infer<typeof schema>;

export interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const { data: groups = [] } = useQuery({
    queryKey: ['adminAllGroups'],
    queryFn: () => apiRequest<any[]>('/groups/all'),
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'PUBLISHED',
      targetType: 'ALL_STUDENTS',
      targetGroupIds: [],
    },
  });

  const targetType = watch('targetType');

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const payload = {
        ...data,
        dueDate: new Date(data.dueDate).toISOString(),
        targetGroupIds: data.targetType === 'SELECTED_GROUP' ? selectedGroups : [],
      };
      return apiRequest('/assignments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      reset();
      setSelectedGroups([]);
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to create assignment');
    },
  });

  const onSubmit = (data: FormValues) => {
    setErrorMsg(null);
    mutation.mutate(data);
  };

  const toggleGroup = (groupId: string) => {
    const updated = selectedGroups.includes(groupId)
      ? selectedGroups.filter((id) => id !== groupId)
      : [...selectedGroups, groupId];
    setSelectedGroups(updated);
    setValue('targetGroupIds', updated);
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Create Assignment">
      {errorMsg && (
        <div className="mb-4 rounded-md bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <Input
          label="Assignment Title"
          placeholder="e.g. Distributed Systems Lab 1"
          error={errors.title?.message}
          {...register('title')}
        />

        <Textarea
          label="Description"
          placeholder="Provide assignment instructions and requirements..."
          rows={3}
          error={errors.description?.message}
          {...register('description')}
        />

        <Input
          label="Due Date and Time"
          type="datetime-local"
          error={errors.dueDate?.message}
          {...register('dueDate')}
        />

        <Input
          label="OneDrive Submission URL (HTTPS)"
          placeholder="https://onedrive.live.com/..."
          error={errors.oneDriveUrl?.message}
          {...register('oneDriveUrl')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Publication Status"
            options={[
              { label: 'Published', value: 'PUBLISHED' },
              { label: 'Draft', value: 'DRAFT' },
              { label: 'Archived', value: 'ARCHIVED' },
            ]}
            error={errors.status?.message}
            {...register('status')}
          />

          <Select
            label="Target Audience"
            options={[
              { label: 'All Students', value: 'ALL_STUDENTS' },
              { label: 'Selected Groups', value: 'SELECTED_GROUP' },
            ]}
            error={errors.targetType?.message}
            {...register('targetType')}
          />
        </div>

        {targetType === 'SELECTED_GROUP' && (
          <div className="rounded-md border border-border p-3 space-y-2 bg-slate-50/50">
            <label className="block text-xs font-semibold text-main-text uppercase">
              Select Target Groups
            </label>
            {groups.length === 0 ? (
              <p className="text-xs text-muted-text">No active groups available</p>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1">
                {groups.map((g) => (
                  <label
                    key={g.id}
                    className="flex items-center space-x-2 text-xs text-main-text cursor-pointer hover:bg-white p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(g.id)}
                      onChange={() => toggleGroup(g.id)}
                      className="rounded border-border text-brand-500 focus:ring-brand-500"
                    />
                    <span>{g.name}</span>
                  </label>
                ))}
              </div>
            )}
            {errors.targetGroupIds && (
              <p className="text-xs text-red-600">{errors.targetGroupIds.message}</p>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-2 border-t border-border mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            Save Assignment
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
