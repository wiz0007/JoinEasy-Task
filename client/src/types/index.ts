export type Role = 'STUDENT' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type GroupMemberRole = 'OWNER' | 'MEMBER';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
export type AssignmentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AssignmentTargetType = 'ALL_STUDENTS' | 'SELECTED_GROUP';
export type SubmissionStatus = 'SUBMITTED' | 'PENDING' | 'OVERDUE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  studentId?: string | null;
  status: UserStatus;
  createdAt: string;
}

export interface ActiveGroupSummary {
  id: string;
  name: string;
  role: GroupMemberRole;
  maxMembers: number;
}

export interface GroupMemberUser {
  id: string;
  userId: string;
  role: GroupMemberRole;
  status: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    studentId?: string | null;
  };
}

export interface GroupInvitationItem {
  id: string;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  invitedUser: {
    id: string;
    name: string;
    email: string;
    studentId?: string | null;
  };
}

export interface GroupDetails {
  id: string;
  name: string;
  status: string;
  maxMembers: number;
  currentUserRole: GroupMemberRole | null;
  createdBy: {
    id: string;
    name: string;
    email: string;
    studentId?: string | null;
  };
  members: GroupMemberUser[];
  invitations: GroupInvitationItem[];
}

export interface ReceivedInvitation {
  id: string;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  group: {
    id: string;
    name: string;
    maxMembers: number;
    createdBy: {
      id: string;
      name: string;
      email: string;
    };
    _count: {
      members: number;
    };
  };
  invitedBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AssignmentTarget {
  id: string;
  targetType: AssignmentTargetType;
  groupId?: string | null;
  group?: {
    id: string;
    name: string;
  } | null;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  oneDriveUrl: string;
  createdById: string;
  status: AssignmentStatus;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  targets: AssignmentTarget[];
}

export interface SubmissionConfirmation {
  id: string;
  assignmentId: string;
  groupId: string;
  confirmedAt: string;
  isLate: boolean;
  confirmedBy: {
    id: string;
    name: string;
    email: string;
    studentId?: string | null;
  };
}

export interface GroupProgressItem {
  assignmentId: string;
  title: string;
  dueDate: string;
  oneDriveUrl: string;
  status: SubmissionStatus;
  confirmation: {
    id: string;
    confirmedAt: string;
    isLate: boolean;
    confirmedBy: {
      id: string;
      name: string;
      email: string;
      studentId?: string | null;
    };
  } | null;
}

export interface GroupProgressResponse {
  group: {
    id: string;
    name: string;
    membersCount: number;
    maxMembers: number;
  };
  summary: {
    total: number;
    submitted: number;
    pending: number;
    overdue: number;
    progressPercentage: number;
  };
  assignments: GroupProgressItem[];
}

export interface AdminDashboardSummary {
  totalAssignments: number;
  totalGroups: number;
  totalApplicablePairs: number;
  submittedPairs: number;
  pendingPairs: number;
  overduePairs: number;
  overallCompletionRate: number;
}

export interface AssignmentAnalyticsItem {
  id: string;
  title: string;
  dueDate: string;
  targetType: 'ALL_STUDENTS' | 'SELECTED_GROUP';
  totalTargetedGroups: number;
  submittedGroupsCount: number;
  pendingGroupsCount: number;
  overdueGroupsCount: number;
  completionRate: number;
  groups: {
    groupId: string;
    groupName: string;
    status: SubmissionStatus;
    confirmation: {
      confirmedAt: string;
      isLate: boolean;
      confirmedBy: { id: string; name: string; email: string };
    } | null;
  }[];
}

export interface GroupAnalyticsItem {
  id: string;
  name: string;
  activeMembersCount: number;
  members: { id: string; name: string; email: string; studentId?: string | null }[];
  applicableAssignmentsCount: number;
  submittedCount: number;
  pendingCount: number;
  overdueCount: number;
  completionRate: number;
}

export interface StudentAnalyticsItem {
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentCode: string;
  groupId: string;
  groupName: string;
  assignmentId: string;
  assignmentTitle: string;
  dueDate: string;
  status: SubmissionStatus;
  confirmedBy: string | null;
  confirmedAt: string | null;
  isLate: boolean;
}
