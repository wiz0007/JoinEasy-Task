import { SubmissionsRepository } from './submissions.repository.js';
import { GroupsRepository } from '../groups/groups.repository.js';
import { AssignmentsRepository } from '../assignments/assignments.repository.js';
import { ApiError } from '../../utils/api-error.js';
import { Role } from '@prisma/client';

export class SubmissionsService {
  constructor(
    private readonly submissionsRepo: SubmissionsRepository = new SubmissionsRepository(),
    private readonly groupsRepo: GroupsRepository = new GroupsRepository(),
    private readonly assignmentsRepo: AssignmentsRepository = new AssignmentsRepository()
  ) {}

  async confirmSubmission(userId: string, assignmentId: string, groupId: string) {
    // 1. Verify group exists and is active
    const group = await this.groupsRepo.findGroupById(groupId);
    if (!group || group.status !== 'ACTIVE') {
      throw ApiError.notFound('Group not found or inactive');
    }

    // 2. Verify requesting user is an active member of this group
    const membership = group.members.find(
      (m) => m.userId === userId && m.status === 'ACTIVE'
    );
    if (!membership) {
      throw ApiError.forbidden('You are not an active member of this group');
    }

    // 3. Verify assignment exists and is PUBLISHED
    const assignment = await this.assignmentsRepo.findAssignmentById(assignmentId);
    if (!assignment || assignment.status !== 'PUBLISHED') {
      throw ApiError.notFound('Assignment not found or not published');
    }

    // 4. Verify assignment is applicable to this group
    const isTargetedToAll = assignment.targets.some((t) => t.targetType === 'ALL_STUDENTS');
    const isTargetedToGroup = assignment.targets.some(
      (t) => t.targetType === 'SELECTED_GROUP' && t.groupId === groupId
    );

    if (!isTargetedToAll && !isTargetedToGroup) {
      throw ApiError.forbidden('This assignment is not assigned to your group');
    }

    // 5. Check if already confirmed
    const existing = await this.submissionsRepo.findConfirmation(assignmentId, groupId);
    if (existing) {
      throw ApiError.conflict('Submission has already been confirmed for this group');
    }

    // 6. Check if late
    const isLate = Date.now() > new Date(assignment.dueDate).getTime();

    // 7. Create confirmation transactionally
    try {
      const confirmation = await this.submissionsRepo.createConfirmation({
        assignmentId,
        groupId,
        confirmedById: userId,
        isLate,
      });

      return {
        id: confirmation.id,
        assignmentId: confirmation.assignmentId,
        groupId: confirmation.groupId,
        confirmedAt: confirmation.confirmedAt,
        isLate: confirmation.isLate,
        confirmedBy: (confirmation as any).confirmedBy,
      };
    } catch (err: any) {
      if (err.message === 'ALREADY_CONFIRMED') {
        throw ApiError.conflict('Submission has already been confirmed for this group');
      }
      throw err;
    }
  }

  async getSubmission(
    userId: string,
    role: Role,
    assignmentId: string,
    groupId: string
  ) {
    if (role !== 'ADMIN') {
      const membership = await this.groupsRepo.findActiveMembershipForUser(userId);
      if (!membership || membership.groupId !== groupId) {
        throw ApiError.forbidden('You are not authorized to view this group submission');
      }
    }

    return this.submissionsRepo.findConfirmation(assignmentId, groupId);
  }

  async getGroupSubmissions(userId: string, role: Role, groupId: string) {
    if (role !== 'ADMIN') {
      const membership = await this.groupsRepo.findActiveMembershipForUser(userId);
      if (!membership || membership.groupId !== groupId) {
        throw ApiError.forbidden('You are not authorized to view this group submissions');
      }
    }

    return this.submissionsRepo.listConfirmationsForGroup(groupId);
  }

  async getGroupProgress(userId: string, role: Role, groupId: string) {
    if (role !== 'ADMIN') {
      const membership = await this.groupsRepo.findActiveMembershipForUser(userId);
      if (!membership || membership.groupId !== groupId) {
        throw ApiError.forbidden('You are not authorized to view this group progress');
      }
    }

    const group = await this.groupsRepo.findGroupById(groupId);
    if (!group || group.status !== 'ACTIVE') {
      throw ApiError.notFound('Group not found');
    }

    // Find all published assignments applicable to this group
    const publishedAssignments = await this.assignmentsRepo.listPublishedAssignmentsForStudent(groupId);

    // Find all confirmations for this group
    const confirmations = await this.submissionsRepo.listConfirmationsForGroup(groupId);
    const confirmationMap = new Map(confirmations.map((c) => [c.assignmentId, c]));

    const now = Date.now();
    let submittedCount = 0;
    let overdueCount = 0;
    let pendingCount = 0;

    const items = publishedAssignments.map((a) => {
      const confirmation = confirmationMap.get(a.id);
      const isPastDue = now > new Date(a.dueDate).getTime();

      let status: 'SUBMITTED' | 'OVERDUE' | 'PENDING';
      if (confirmation) {
        status = 'SUBMITTED';
        submittedCount++;
      } else if (isPastDue) {
        status = 'OVERDUE';
        overdueCount++;
      } else {
        status = 'PENDING';
        pendingCount++;
      }

      return {
        assignmentId: a.id,
        title: a.title,
        dueDate: a.dueDate,
        oneDriveUrl: a.oneDriveUrl,
        status,
        confirmation: confirmation
          ? {
              id: confirmation.id,
              confirmedAt: confirmation.confirmedAt,
              isLate: confirmation.isLate,
              confirmedBy: confirmation.confirmedBy,
            }
          : null,
      };
    });

    const total = publishedAssignments.length;
    const progressPercentage = total === 0 ? 0 : Math.round((submittedCount / total) * 100);

    return {
      group: {
        id: group.id,
        name: group.name,
        membersCount: group.members.length,
        maxMembers: group.maxMembers,
      },
      summary: {
        total,
        submitted: submittedCount,
        pending: pendingCount,
        overdue: overdueCount,
        progressPercentage,
      },
      assignments: items,
    };
  }
}
