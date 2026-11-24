export type Role = 'STUDENT' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type GroupMemberRole = 'OWNER' | 'MEMBER';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
export type AssignmentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AssignmentTargetType = 'ALL_STUDENTS' | 'SELECTED_GROUP';

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
