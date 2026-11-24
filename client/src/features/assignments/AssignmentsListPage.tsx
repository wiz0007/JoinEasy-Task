import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api.js';
import { Assignment } from '../../types/index.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { CreateAssignmentModal } from './CreateAssignmentModal.js';
import { EditAssignmentModal } from './EditAssignmentModal.js';
import { formatDate, isPastDate } from '../../lib/utils.js';
import { BookOpen, Plus, ExternalLink, Edit } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.js';

export const AssignmentsListPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => apiRequest<Assignment[]>('/assignments'),
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading assignments..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-main-text">Assignments</h1>
          <p className="text-xs text-muted-text mt-0.5">
            {isAdmin ? 'Manage course assignments and targets' : 'Assigned tasks and coursework'}
          </p>
        </div>

        {isAdmin && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            icon={<Plus className="h-4 w-4" />}
            size="sm"
          >
            Create Assignment
          </Button>
        )}
      </div>

      <Card>
        {assignments.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={isAdmin ? 'No assignments created yet.' : 'No active assignments for your group.'}
            action={
              isAdmin ? (
                <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                  Create Assignment
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="divide-y divide-border/60">
            {assignments.map((a) => {
              const overdue = isPastDate(a.dueDate);
              const isSelectedGroup = a.targets.some((t) => t.targetType === 'SELECTED_GROUP');

              return (
                <div
                  key={a.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/assignments/${a.id}`}
                        className="font-semibold text-sm text-main-text hover:text-brand-500 transition-colors"
                      >
                        {a.title}
                      </Link>
                      {isAdmin && (
                        <Badge variant={a.status === 'PUBLISHED' ? 'success' : 'outline'}>
                          {a.status}
                        </Badge>
                      )}
                      <Badge variant="default">
                        {isSelectedGroup ? 'Selected Groups' : 'All Students'}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-text mt-1 line-clamp-2">{a.description}</p>

                    <div className="flex items-center space-x-3 text-[11px] text-muted-text mt-2">
                      <span>Due: {formatDate(a.dueDate)}</span>
                      <span>•</span>
                      <span>By: {a.createdBy.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <Badge variant={overdue ? 'danger' : 'warning'}>
                      {overdue ? 'Overdue' : 'Active'}
                    </Badge>

                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingAssignment(a)}
                        icon={<Edit className="h-3.5 w-3.5" />}
                        iconOnlyOnMobile
                        aria-label="Edit assignment"
                      >
                        Edit
                      </Button>
                    )}

                    <a
                      href={a.oneDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-brand-500 hover:text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-md transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>OneDrive</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modals */}
      {isAdmin && (
        <>
          <CreateAssignmentModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
          />
          <EditAssignmentModal
            assignment={editingAssignment}
            isOpen={Boolean(editingAssignment)}
            onClose={() => setEditingAssignment(null)}
          />
        </>
      )}
    </div>
  );
};
