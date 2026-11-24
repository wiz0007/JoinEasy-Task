import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api.js';
import { GroupDetails } from '../../types/index.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { CreateGroupModal } from './CreateGroupModal.js';
import { InviteMemberModal } from './InviteMemberModal.js';
import { formatDate } from '../../lib/utils.js';
import { Users, UserPlus, Trash2 } from 'lucide-react';

export const GroupsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const { data: myGroup, isLoading } = useQuery({
    queryKey: ['myGroup'],
    queryFn: () => apiRequest<GroupDetails | null>('/groups/me'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      apiRequest(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGroup'] });
    },
  });

  const cancelInvitationMutation = useMutation({
    mutationFn: ({ groupId, invitationId }: { groupId: string; invitationId: string }) =>
      apiRequest(`/groups/${groupId}/invitations/${invitationId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGroup'] });
    },
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading group details..." />;
  }

  if (!myGroup) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-main-text">My Group</h1>
        </div>
        <EmptyState
          icon={Users}
          title="You are not a member of any group yet."
          action={
            <Button onClick={() => setIsCreateOpen(true)} icon={<UserPlus className="h-4 w-4" />}>
              Create Group
            </Button>
          }
        />
        <CreateGroupModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      </div>
    );
  }

  const isOwner = myGroup.currentUserRole === 'OWNER';
  const isFull = myGroup.members.length >= myGroup.maxMembers;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-main-text">{myGroup.name}</h1>
          <p className="text-xs text-muted-text mt-0.5">
            Capacity: {myGroup.members.length} / {myGroup.maxMembers} Students
          </p>
        </div>

        {isOwner && (
          <Button
            onClick={() => setIsInviteOpen(true)}
            disabled={isFull}
            icon={<UserPlus className="h-4 w-4" />}
            size="sm"
          >
            {isFull ? 'Group Full' : 'Invite Member'}
          </Button>
        )}
      </div>

      {/* Group Members List */}
      <Card title="Group Members">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-slate-50/50 text-muted-text uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Student</th>
                <th className="py-2.5 px-3">Student ID</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Joined</th>
                {isOwner && <th className="py-2.5 px-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {myGroup.members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 font-medium text-main-text">
                    {m.user.name}
                    <div className="text-[11px] text-muted-text font-normal">{m.user.email}</div>
                  </td>
                  <td className="py-3 px-3 text-muted-text">{m.user.studentId || '—'}</td>
                  <td className="py-3 px-3">
                    <Badge variant={m.role === 'OWNER' ? 'info' : 'default'}>{m.role}</Badge>
                  </td>
                  <td className="py-3 px-3 text-muted-text">{formatDate(m.joinedAt)}</td>
                  {isOwner && (
                    <td className="py-3 px-3 text-right">
                      {m.role !== 'OWNER' && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Remove ${m.user.name} from group?`)) {
                              removeMemberMutation.mutate({
                                groupId: myGroup.id,
                                userId: m.userId,
                              });
                            }
                          }}
                          aria-label={`Remove ${m.user.name}`}
                          className="rounded p-1 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pending Invitations (Owner View) */}
      {isOwner && (
        <Card title="Pending Invitations">
          {myGroup.invitations.length === 0 ? (
            <p className="text-xs text-muted-text">No pending invitations.</p>
          ) : (
            <div className="divide-y divide-border/60">
              {myGroup.invitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div>
                    <span className="font-semibold text-main-text">{inv.invitedUser.name}</span>
                    <span className="text-muted-text ml-2">({inv.invitedUser.email})</span>
                    <div className="text-[11px] text-muted-text">
                      Expires: {formatDate(inv.expiresAt)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="warning">{inv.status}</Badge>
                    <button
                      onClick={() =>
                        cancelInvitationMutation.mutate({
                          groupId: myGroup.id,
                          invitationId: inv.id,
                        })
                      }
                      aria-label="Cancel invitation"
                      className="text-xs text-red-600 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Modals */}
      <InviteMemberModal
        groupId={myGroup.id}
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />
    </div>
  );
};
