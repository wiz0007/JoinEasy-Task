import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api.js';
import { Card } from '../../components/ui/Card.js';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { formatDate } from '../../lib/utils.js';
import { Users } from 'lucide-react';

export const AdminGroupsListPage: React.FC = () => {
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['adminAllGroups'],
    queryFn: () => apiRequest<any[]>('/groups/all'),
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading groups..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-main-text">All Student Groups</h1>
          <p className="text-xs text-muted-text mt-0.5">Active registered groups</p>
        </div>
      </div>

      <Card>
        {groups.length === 0 ? (
          <EmptyState icon={Users} title="No groups registered yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-slate-50/50 text-muted-text uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Group Name</th>
                  <th className="py-2.5 px-3">Active Members</th>
                  <th className="py-2.5 px-3">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {groups.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-medium text-main-text">{g.name}</td>
                    <td className="py-3 px-3 text-muted-text">{g._count?.members || 0}</td>
                    <td className="py-3 px-3 text-muted-text">{formatDate(g.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
