import React, { useState, useEffect } from 'react';
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
import { Assignment } from '../../types/index.js';

const schema = z.object({
  title: z.string().trim().min(3).optional(),
  description: z.string().trim().min(5).optional(),
  dueDate: z.string().optional(),
  oneDriveUrl: z.string().trim().regex(/^https:\/\/.+/i, 'Must be valid HTTPS URL').optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  targetType: z.enum(['ALL_STUDENTS', 'SELECTED_GROUP']).optional(),
  targetGroupIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof schema>;

export interface EditAssignmentModalProps {
  assignment: Assignment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditAssignmentModal: React.FC<EditAssignmentModalProps> = ({
  assignment,
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
  });

  useEffect(() => {
    if (assignment) {
      const isSelectedGroup = assignment.targets.some((t) => t.targetType === 'SELECTED_GROUP');
      const groupIds = assignment.targets
        .filter((t) => t.targetType === 'SELECTED_GROUP' && t.groupId)
        .map((t) => t.groupId as string);

      setSelectedGroups(groupIds);

      // Format ISO string to local input datetime-local
      const date = new Date(assignment.dueDate);
      const localDatetime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

      reset({
        title: assignment.title,
        description: assignment.description,
        dueDate: localDatetime,
        oneDriveUrl: assignment.oneDriveUrl,
        status: assignment.status,
        targetType: isSelectedGroup ? 'SELECTED_GROUP' : 'ALL_STUDENTS',
        targetGroupIds: groupIds,
      });
    }
  }, [assignment, reset]);

  const targetType = watch('targetType');

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const payload = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        targetGroupIds: data.targetType === 'SELECTED_GROUP' ? selectedGroups : [],
      };
      return apiRequest(`/assignments/${assignment!.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment', assignment?.id] });
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to update assignment');
    },
  });

  const toggleGroup = (groupId: string) => {
    const updated = selectedGroups.includes(groupId)
      ? selectedGroups.filter((id) => id !== groupId)
      : [...selectedGroups, groupId];
    setSelectedGroups(updated);
    setValue('targetGroupIds', updated);
  };

  const onSubmit = (data: FormValues) => {
    setErrorMsg(null);
    mutation.mutate(data);
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Edit Assignment">
      {errorMsg && (
        <div className="mb-4 rounded-md bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <Input label="Assignment Title" error={errors.title?.message} {...register('title')} />

        <Textarea label="Description" rows={3} error={errors.description?.message} {...register('description')} />

        <Input label="Due Date" type="datetime-local" error={errors.dueDate?.message} {...register('dueDate')} />

        <Input label="OneDrive URL" error={errors.oneDriveUrl?.message} {...register('oneDriveUrl')} />

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
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-2 border-t border-border mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            Update Assignment
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
