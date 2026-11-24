import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api.js';
import { Assignment, GroupDetails, ReceivedInvitation } from '../../types/index.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { formatDate, isPastDate } from '../../lib/utils.js';
import { Users, BookOpen, Mail, ExternalLink, Plus } from 'lucide-react';

export const StudentDashboard: React.FC = () => {

  const { data: myGroup, isLoading: loadingGroup } = useQuery({
    queryKey: ['myGroup'],
    queryFn: () => apiRequest<GroupDetails | null>('/groups/me'),
  });

  const { data: invitations = [], isLoading: loadingInvites } = useQuery({
    queryKey: ['myInvitations'],
    queryFn: () => apiRequest<ReceivedInvitation[]>('/invitations/me'),
  });

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => apiRequest<Assignment[]>('/assignments'),
  });

  if (loadingGroup || loadingInvites || loadingAssignments) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-blue-50 p-2.5 text-brand-500">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-text uppercase">Group Status</p>
              <p className="text-base font-bold text-main-text">
                {myGroup ? myGroup.name : 'No Active Group'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-text uppercase">Pending Invites</p>
              <p className="text-base font-bold text-main-text">{invitations.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-text uppercase">Available Assignments</p>
              <p className="text-base font-bold text-main-text">{assignments.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Group Quick Panel */}
      <Card
        title="Group Membership"
        action={
          !myGroup ? (
            <Link to="/groups">
              <Button size="sm" icon={<Plus className="h-4 w-4" />}>
                Create Group
              </Button>
            </Link>
          ) : (
            <Link to="/groups">
              <Button size="sm" variant="outline">
                Manage Group
              </Button>
            </Link>
          )
        }
      >
        {myGroup ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-main-text">{myGroup.name}</span>
              <span className="text-xs text-muted-text">
                {myGroup.members.length} / {myGroup.maxMembers} Members
              </span>
            </div>
            <div className="divide-y divide-border/60">
              {myGroup.members.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2 text-xs">
                  <div>
                    <span className="font-medium text-main-text">{m.user.name}</span>
                    <span className="text-muted-text ml-2">({m.user.email})</span>
                  </div>
                  <Badge variant={m.role === 'OWNER' ? 'info' : 'default'}>{m.role}</Badge>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="You are not part of any group yet"
            action={
              <div className="flex space-x-2">
                <Link to="/groups">
                  <Button size="sm">Create Group</Button>
                </Link>
                {invitations.length > 0 && (
                  <Link to="/invitations">
                    <Button size="sm" variant="secondary">
                      View Invitations ({invitations.length})
                    </Button>
                  </Link>
                )}
              </div>
            }
          />
        )}
      </Card>

      {/* Recent Assignments */}
      <Card
        title="Recent Assignments"
        action={
          <Link to="/assignments">
            <Button size="sm" variant="ghost">
              View All
            </Button>
          </Link>
        }
      >
        {assignments.length === 0 ? (
          <EmptyState icon={BookOpen} title="No assignments posted yet" />
        ) : (
          <div className="divide-y divide-border/60">
            {assignments.slice(0, 5).map((a) => {
              const overdue = isPastDate(a.dueDate);
              return (
                <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2">
                  <div>
                    <Link
                      to={`/assignments/${a.id}`}
                      className="font-semibold text-sm text-main-text hover:text-brand-500 transition-colors"
                    >
                      {a.title}
                    </Link>
                    <p className="text-xs text-muted-text mt-0.5 line-clamp-1">{a.description}</p>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="text-xs text-muted-text">Due {formatDate(a.dueDate)}</span>
                    <Badge variant={overdue ? 'danger' : 'warning'}>
                      {overdue ? 'Overdue' : 'Pending'}
                    </Badge>
                    <a
                      href={a.oneDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-text hover:text-brand-500"
                      aria-label="Open OneDrive submission link"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
