import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api.js';
import { ReceivedInvitation } from '../../types/index.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { formatDate } from '../../lib/utils.js';
import { Mail, Check, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.js';

export const InvitationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['myInvitations'],
    queryFn: () => apiRequest<ReceivedInvitation[]>('/invitations/me'),
  });

  const acceptMutation = useMutation({
    mutationFn: (invitationId: string) =>
      apiRequest(`/invitations/${invitationId}/accept`, { method: 'POST' }),
    onSuccess: async () => {
      setActionError(null);
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['myInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['myGroup'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to accept invitation');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (invitationId: string) =>
      apiRequest(`/invitations/${invitationId}/reject`, { method: 'POST' }),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['myInvitations'] });
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to reject invitation');
    },
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading invitations..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-main-text">Group Invitations</h1>
          <p className="text-xs text-muted-text mt-0.5">Invitations you have received</p>
        </div>
      </div>

      {actionError && (
        <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 border border-red-200">
          {actionError}
        </div>
      )}

      <Card>
        {invitations.length === 0 ? (
          <EmptyState icon={Mail} title="You have no pending invitations." />
        ) : (
          <div className="divide-y divide-border/60">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-main-text">
                      {inv.group.name}
                    </span>
                    <Badge variant="warning">{inv.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-text mt-0.5">
                    Invited by <span className="font-medium text-main-text">{inv.invitedBy.name}</span> ({inv.invitedBy.email})
                  </p>
                  <p className="text-[11px] text-muted-text mt-0.5">
                    Group size: {inv.group._count.members} / {inv.group.maxMembers} • Expires: {formatDate(inv.expiresAt)}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectMutation.mutate(inv.id)}
                    isLoading={rejectMutation.isPending}
                    icon={<X className="h-4 w-4" />}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => acceptMutation.mutate(inv.id)}
                    isLoading={acceptMutation.isPending}
                    icon={<Check className="h-4 w-4" />}
                  >
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
