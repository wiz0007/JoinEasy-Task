import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api.js';
import { GroupDetails, ReceivedInvitation, GroupProgressResponse } from '../../types/index.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { ProgressBar } from '../../components/ui/ProgressBar.js';
import { ConfirmSubmissionDialog } from '../submissions/ConfirmSubmissionDialog.js';
import { formatDate } from '../../lib/utils.js';
import { Users, BookOpen, Mail, ExternalLink, Plus, CheckCircle, Clock } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const [selectedForConfirm, setSelectedForConfirm] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const { data: myGroup, isLoading: loadingGroup } = useQuery({
    queryKey: ['myGroup'],
    queryFn: () => apiRequest<GroupDetails | null>('/groups/me'),
  });

  const { data: invitations = [], isLoading: loadingInvites } = useQuery({
    queryKey: ['myInvitations'],
    queryFn: () => apiRequest<ReceivedInvitation[]>('/invitations/me'),
  });

  const { data: progressData, isLoading: loadingProgress } = useQuery({
    queryKey: ['groupProgress', myGroup?.id],
    queryFn: () => apiRequest<GroupProgressResponse>(`/groups/${myGroup!.id}/progress`),
    enabled: Boolean(myGroup?.id),
  });

  if (loadingGroup || loadingInvites || (myGroup && loadingProgress)) {
    return <LoadingSpinner message="Loading student dashboard..." />;
  }

  const summary = progressData?.summary || {
    total: 0,
    submitted: 0,
    pending: 0,
    overdue: 0,
    progressPercentage: 0,
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-blue-50 p-2.5 text-brand-500">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-text uppercase">Group</p>
              <p className="text-sm font-bold text-main-text truncate">
                {myGroup ? myGroup.name : 'No Group'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-text uppercase">Submitted</p>
              <p className="text-base font-bold text-main-text">
                {summary.submitted} / {summary.total}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-text uppercase">Pending Tasks</p>
              <p className="text-base font-bold text-main-text">{summary.pending}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-purple-50 p-2.5 text-purple-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-text uppercase">Invitations</p>
              <p className="text-base font-bold text-main-text">{invitations.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Group Progress Bar Panel */}
      {myGroup && (
        <Card title="Group Submission Progress">
          <ProgressBar
            value={summary.progressPercentage}
            submitted={summary.submitted}
            pending={summary.pending}
            overdue={summary.overdue}
          />
        </Card>
      )}

      {/* Assignment List with Confirmation Actions */}
      <Card
        title="Course Assignments"
        action={
          <Link to="/assignments">
            <Button size="sm" variant="ghost">
              All Assignments
            </Button>
          </Link>
        }
      >
        {!myGroup ? (
          <EmptyState
            icon={Users}
            title="Join or create a group to access group-targeted assignments and submissions."
            action={
              <Link to="/groups">
                <Button size="sm" icon={<Plus className="h-4 w-4" />}>
                  Create Group
                </Button>
              </Link>
            }
          />
        ) : !progressData || progressData.assignments.length === 0 ? (
          <EmptyState icon={BookOpen} title="No assignments posted yet." />
        ) : (
          <div className="divide-y divide-border/60">
            {progressData.assignments.map((item) => (
              <div
                key={item.assignmentId}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-3"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/assignments/${item.assignmentId}`}
                      className="font-semibold text-sm text-main-text hover:text-brand-500 transition-colors"
                    >
                      {item.title}
                    </Link>
                    <Badge
                      variant={
                        item.status === 'SUBMITTED'
                          ? 'success'
                          : item.status === 'OVERDUE'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {item.status}
                    </Badge>
                    {item.confirmation?.isLate && (
                      <Badge variant="danger">Late</Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-text mt-1">
                    <span>Due: {formatDate(item.dueDate)}</span>
                    {item.confirmation && (
                      <span>
                        • Confirmed by {item.confirmation.confirmedBy.name} on{' '}
                        {formatDate(item.confirmation.confirmedAt)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <a
                    href={item.oneDriveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-brand-500 hover:text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-md transition-colors"
                  >
                    <span>OneDrive</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  {item.status !== 'SUBMITTED' && (
                    <Button
                      size="sm"
                      onClick={() =>
                        setSelectedForConfirm({
                          id: item.assignmentId,
                          title: item.title,
                        })
                      }
                    >
                      Yes, I have submitted
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Two-step Confirmation Modal */}
      {selectedForConfirm && myGroup && (
        <ConfirmSubmissionDialog
          assignmentId={selectedForConfirm.id}
          assignmentTitle={selectedForConfirm.title}
          groupId={myGroup.id}
          isOpen={Boolean(selectedForConfirm)}
          onClose={() => setSelectedForConfirm(null)}
        />
      )}
    </div>
  );
};
