import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api.js';
import {
  AdminDashboardSummary,
  AssignmentAnalyticsItem,
  GroupAnalyticsItem,
  StudentAnalyticsItem,
} from '../../types/index.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { ProgressBar } from '../../components/ui/ProgressBar.js';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { formatDate } from '../../lib/utils.js';
import {
  BookOpen,
  Users,
  Plus,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { CreateAssignmentModal } from '../assignments/CreateAssignmentModal.js';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'assignments' | 'groups' | 'students'
  >('overview');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['adminDashboardSummary'],
    queryFn: () => apiRequest<AdminDashboardSummary>('/admin/analytics/dashboard'),
  });

  const { data: assignmentAnalytics = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['assignmentAnalytics'],
    queryFn: () => apiRequest<AssignmentAnalyticsItem[]>('/admin/analytics/assignments'),
  });

  const { data: groupAnalytics = [], isLoading: loadingGroups } = useQuery({
    queryKey: ['groupAnalytics'],
    queryFn: () => apiRequest<GroupAnalyticsItem[]>('/admin/analytics/groups'),
  });

  const { data: studentAnalytics = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['studentAnalytics'],
    queryFn: () => apiRequest<StudentAnalyticsItem[]>('/admin/analytics/students'),
  });

  if (loadingSummary || loadingAssignments || loadingGroups || loadingStudents) {
    return <LoadingSpinner message="Loading analytics dashboard..." />;
  }

  const s = summary || {
    totalAssignments: 0,
    totalGroups: 0,
    totalApplicablePairs: 0,
    submittedPairs: 0,
    pendingPairs: 0,
    overduePairs: 0,
    overallCompletionRate: 0,
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-main-text">Professor Analytics Dashboard</h1>
          <p className="text-xs text-muted-text mt-0.5">
            Real-time assignment submissions and group performance tracking
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          icon={<Plus className="h-4 w-4" />}
          size="sm"
        >
          Create Assignment
        </Button>
      </div>

      {/* Global Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-blue-50 p-2.5 text-brand-500">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-text uppercase">Published Assignments</p>
              <p className="text-base font-bold text-main-text">{s.totalAssignments}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-purple-50 p-2.5 text-purple-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-text uppercase">Active Groups</p>
              <p className="text-base font-bold text-main-text">{s.totalGroups}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-text uppercase">Submitted Pairs</p>
              <p className="text-base font-bold text-main-text">
                {s.submittedPairs} / {s.totalApplicablePairs}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-red-50 p-2.5 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-text uppercase">Overdue Submissions</p>
              <p className="text-base font-bold text-main-text">{s.overduePairs}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Overall Progress Bar */}
      <Card title="Overall Course Submission Progress">
        <ProgressBar
          value={s.overallCompletionRate}
          submitted={s.submittedPairs}
          pending={s.pendingPairs}
          overdue={s.overduePairs}
        />
      </Card>

      {/* Analytics Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-brand-500 text-brand-500'
                : 'border-transparent text-muted-text hover:text-main-text'
            }`}
          >
            Assignment Overview
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'assignments'
                ? 'border-brand-500 text-brand-500'
                : 'border-transparent text-muted-text hover:text-main-text'
            }`}
          >
            Assignment-Wise Analytics
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'groups'
                ? 'border-brand-500 text-brand-500'
                : 'border-transparent text-muted-text hover:text-main-text'
            }`}
          >
            Group-Wise Performance
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'students'
                ? 'border-brand-500 text-brand-500'
                : 'border-transparent text-muted-text hover:text-main-text'
            }`}
          >
            Student Confirmation Details
          </button>
        </nav>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <Card title="Recent Assignments & Status">
          {assignmentAnalytics.length === 0 ? (
            <EmptyState icon={BookOpen} title="No published assignments yet." />
          ) : (
            <div className="divide-y divide-border/60">
              {assignmentAnalytics.map((a) => (
                <div key={a.id} className="py-3.5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <Link
                        to={`/assignments/${a.id}`}
                        className="font-semibold text-sm text-main-text hover:text-brand-500 transition-colors"
                      >
                        {a.title}
                      </Link>
                      <div className="flex items-center space-x-2 text-xs text-muted-text mt-0.5">
                        <span>Target: {a.targetType === 'ALL_STUDENTS' ? 'All Students' : 'Selected Groups'}</span>
                        <span>•</span>
                        <span>Due: {formatDate(a.dueDate)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <span className="text-xs font-semibold text-brand-500">
                        {a.submittedGroupsCount} / {a.totalTargetedGroups} Groups Submitted ({a.completionRate}%)
                      </span>
                    </div>
                  </div>

                  <ProgressBar value={a.completionRate} />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Assignment-Wise Analytics */}
      {activeTab === 'assignments' && (
        <Card title="Assignment Performance Breakdown">
          {assignmentAnalytics.length === 0 ? (
            <EmptyState icon={BookOpen} title="No assignments found." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-slate-50/50 text-muted-text uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Assignment</th>
                    <th className="py-2.5 px-3">Target Mode</th>
                    <th className="py-2.5 px-3">Targeted Groups</th>
                    <th className="py-2.5 px-3">Submitted</th>
                    <th className="py-2.5 px-3">Pending</th>
                    <th className="py-2.5 px-3">Overdue</th>
                    <th className="py-2.5 px-3">Completion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {assignmentAnalytics.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-semibold text-main-text">{a.title}</td>
                      <td className="py-3 px-3 text-muted-text">
                        <Badge variant="default">{a.targetType}</Badge>
                      </td>
                      <td className="py-3 px-3 text-muted-text">{a.totalTargetedGroups}</td>
                      <td className="py-3 px-3 text-emerald-600 font-semibold">{a.submittedGroupsCount}</td>
                      <td className="py-3 px-3 text-amber-600">{a.pendingGroupsCount}</td>
                      <td className="py-3 px-3 text-red-600">{a.overdueGroupsCount}</td>
                      <td className="py-3 px-3 font-bold text-brand-500">{a.completionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 3: Group-Wise Performance */}
      {activeTab === 'groups' && (
        <Card title="Group Performance Metrics">
          {groupAnalytics.length === 0 ? (
            <EmptyState icon={Users} title="No registered groups yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-slate-50/50 text-muted-text uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Group Name</th>
                    <th className="py-2.5 px-3">Members</th>
                    <th className="py-2.5 px-3">Applicable</th>
                    <th className="py-2.5 px-3">Submitted</th>
                    <th className="py-2.5 px-3">Pending</th>
                    <th className="py-2.5 px-3">Overdue</th>
                    <th className="py-2.5 px-3">Completion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {groupAnalytics.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-semibold text-main-text">{g.name}</td>
                      <td className="py-3 px-3 text-muted-text">{g.activeMembersCount}</td>
                      <td className="py-3 px-3 text-muted-text">{g.applicableAssignmentsCount}</td>
                      <td className="py-3 px-3 text-emerald-600 font-semibold">{g.submittedCount}</td>
                      <td className="py-3 px-3 text-amber-600">{g.pendingCount}</td>
                      <td className="py-3 px-3 text-red-600">{g.overdueCount}</td>
                      <td className="py-3 px-3 font-bold text-brand-500">{g.completionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 4: Student-Wise Confirmation Details */}
      {activeTab === 'students' && (
        <Card title="Student Submission Audit Trail">
          {studentAnalytics.length === 0 ? (
            <EmptyState icon={UserCheck} title="No student records available." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-slate-50/50 text-muted-text uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Student ID</th>
                    <th className="py-2.5 px-3">Group</th>
                    <th className="py-2.5 px-3">Assignment</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Confirmed By</th>
                    <th className="py-2.5 px-3">Confirmation Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {studentAnalytics.map((row, idx) => (
                    <tr key={`${row.studentId}-${row.assignmentId}-${idx}`} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-medium text-main-text">
                        {row.studentName}
                        <div className="text-[11px] text-muted-text font-normal">{row.studentEmail}</div>
                      </td>
                      <td className="py-3 px-3 text-muted-text">{row.studentCode}</td>
                      <td className="py-3 px-3 text-muted-text">{row.groupName}</td>
                      <td className="py-3 px-3 text-main-text font-medium">{row.assignmentTitle}</td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            row.status === 'SUBMITTED'
                              ? 'success'
                              : row.status === 'OVERDUE'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {row.status}
                        </Badge>
                        {row.isLate && <Badge variant="danger" className="ml-1">Late</Badge>}
                      </td>
                      <td className="py-3 px-3 text-muted-text">{row.confirmedBy || '—'}</td>
                      <td className="py-3 px-3 text-muted-text">{formatDate(row.confirmedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Assignment Creation Modal */}
      <CreateAssignmentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
};
