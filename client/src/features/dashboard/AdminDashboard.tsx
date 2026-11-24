import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api.js';
import { Assignment } from '../../types/index.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { formatDate } from '../../lib/utils.js';
import { BookOpen, Users, Plus, ExternalLink } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['adminAssignments'],
    queryFn: () => apiRequest<Assignment[]>('/assignments'),
  });

  const { data: groups = [], isLoading: loadingGroups } = useQuery({
    queryKey: ['adminGroups'],
    queryFn: () => apiRequest<any[]>('/groups/all'),
  });

  if (loadingAssignments || loadingGroups) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const publishedCount = assignments.filter((a) => a.status === 'PUBLISHED').length;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-blue-50 p-2.5 text-brand-500">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-text uppercase">Total Assignments</p>
              <p className="text-base font-bold text-main-text">{assignments.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-text uppercase">Published Assignments</p>
              <p className="text-base font-bold text-main-text">{publishedCount}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-purple-50 p-2.5 text-purple-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-text uppercase">Active Student Groups</p>
              <p className="text-base font-bold text-main-text">{groups.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Assignment Management Table */}
      <Card
        title="Assignments"
        action={
          <Link to="/assignments">
            <Button size="sm" icon={<Plus className="h-4 w-4" />}>
              Create Assignment
            </Button>
          </Link>
        }
      >
        {assignments.length === 0 ? (
          <EmptyState icon={BookOpen} title="No assignments created yet" />
        ) : (
          <div className="divide-y divide-border/60">
            {assignments.map((a) => (
              <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2">
                <div>
                  <Link
                    to={`/assignments/${a.id}`}
                    className="font-semibold text-sm text-main-text hover:text-brand-500 transition-colors"
                  >
                    {a.title}
                  </Link>
                  <p className="text-xs text-muted-text line-clamp-1">{a.description}</p>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <Badge variant={a.status === 'PUBLISHED' ? 'success' : 'outline'}>
                    {a.status}
                  </Badge>
                  <span className="text-xs text-muted-text">Due {formatDate(a.dueDate)}</span>
                  <a
                    href={a.oneDriveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-text hover:text-brand-500"
                    aria-label="Open OneDrive link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
