import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api.js';
import { Assignment } from '../../types/index.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.js';
import { EditAssignmentModal } from './EditAssignmentModal.js';
import { formatDate, isPastDate } from '../../lib/utils.js';
import { ArrowLeft, ExternalLink, Calendar, User, Edit, ShieldAlert } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.js';

export const AssignmentDetailsPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [isEditOpen, setIsEditOpen] = useState(false);

  const {
    data: assignment,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => apiRequest<Assignment>(`/assignments/${assignmentId}`),
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading assignment..." />;
  }

  if (error || !assignment) {
    return (
      <div className="space-y-4">
        <Link to="/assignments" className="inline-flex items-center text-xs text-brand-500 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Assignments
        </Link>
        <Card>
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <ShieldAlert className="h-10 w-10 text-red-500 mb-2" />
            <h2 className="text-base font-semibold text-main-text">Assignment Not Found or Unauthorized</h2>
            <p className="text-xs text-muted-text mt-1">
              You do not have access to view this assignment.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const overdue = isPastDate(assignment.dueDate);
  const isSelectedGroup = assignment.targets.some((t) => t.targetType === 'SELECTED_GROUP');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/assignments"
          className="inline-flex items-center text-xs font-semibold text-muted-text hover:text-main-text transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Assignments
        </Link>

        {isAdmin && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditOpen(true)}
            icon={<Edit className="h-3.5 w-3.5" />}
          >
            Edit Assignment
          </Button>
        )}
      </div>

      <Card>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b border-border gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-main-text">{assignment.title}</h1>
                <Badge variant={overdue ? 'danger' : 'warning'}>
                  {overdue ? 'Overdue' : 'Active'}
                </Badge>
                {isAdmin && (
                  <Badge variant={assignment.status === 'PUBLISHED' ? 'success' : 'outline'}>
                    {assignment.status}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-text mt-1">
                Audience: {isSelectedGroup ? 'Selected Groups' : 'All Students'}
              </p>
            </div>

            <div className="flex flex-col items-end text-xs text-muted-text shrink-0">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Due: {formatDate(assignment.dueDate)}</span>
              </div>
              <div className="flex items-center space-x-1 mt-1">
                <User className="h-3.5 w-3.5" />
                <span>Instructor: {assignment.createdBy.name}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-main-text uppercase tracking-wider mb-2">
              Instructions
            </h3>
            <div className="text-sm text-main-text leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-4 rounded-md border border-border/60">
              {assignment.description}
            </div>
          </div>

          {/* Target Groups Detail for Admin */}
          {isAdmin && isSelectedGroup && (
            <div>
              <h3 className="text-xs font-bold text-main-text uppercase tracking-wider mb-2">
                Targeted Groups
              </h3>
              <div className="flex flex-wrap gap-2">
                {assignment.targets.map((t) => (
                  <Badge key={t.id} variant="info">
                    {t.group?.name || t.groupId}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* External OneDrive Submission Action */}
          <div className="rounded-lg bg-blue-50/50 p-4 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-main-text">OneDrive Submission Destination</p>
              <p className="text-xs text-muted-text mt-0.5">
                Upload your files directly to the external OneDrive repository.
              </p>
            </div>

            <a
              href={assignment.oneDriveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center space-x-2 bg-brand-500 text-white font-medium text-xs px-4 py-2.5 rounded-md hover:bg-brand-600 active:bg-brand-700 shadow-sm shrink-0 transition-colors"
            >
              <span>Open OneDrive Link</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </Card>

      {isAdmin && (
        <EditAssignmentModal
          assignment={assignment}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </div>
  );
};
