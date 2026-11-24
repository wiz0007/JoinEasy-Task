import { AssignmentsRepository } from './assignments.repository.js';
import { GroupsRepository } from '../groups/groups.repository.js';
import { CreateAssignmentDto, UpdateAssignmentDto } from './assignments.schema.js';
import { ApiError } from '../../utils/api-error.js';
import { Role } from '@prisma/client';

export class AssignmentsService {
  constructor(
    private readonly assignmentsRepo: AssignmentsRepository = new AssignmentsRepository(),
    private readonly groupsRepo: GroupsRepository = new GroupsRepository()
  ) {}

  async createAssignment(adminId: string, dto: CreateAssignmentDto) {
    if (dto.targetType === 'SELECTED_GROUP' && dto.targetGroupIds) {
      for (const groupId of dto.targetGroupIds) {
        const group = await this.groupsRepo.findGroupById(groupId);
        if (!group) {
          throw ApiError.badRequest(`Target group ${groupId} does not exist`);
        }
      }
    }

    return this.assignmentsRepo.createAssignmentWithTargets({
      title: dto.title,
      description: dto.description,
      dueDate: new Date(dto.dueDate),
      oneDriveUrl: dto.oneDriveUrl,
      createdById: adminId,
      status: dto.status,
      targetType: dto.targetType,
      targetGroupIds: dto.targetGroupIds,
    });
  }

  async updateAssignment(assignmentId: string, dto: UpdateAssignmentDto) {
    const existing = await this.assignmentsRepo.findAssignmentById(assignmentId);
    if (!existing) {
      throw ApiError.notFound('Assignment not found');
    }

    if (dto.targetType === 'SELECTED_GROUP' && dto.targetGroupIds) {
      for (const groupId of dto.targetGroupIds) {
        const group = await this.groupsRepo.findGroupById(groupId);
        if (!group) {
          throw ApiError.badRequest(`Target group ${groupId} does not exist`);
        }
      }
    }

    return this.assignmentsRepo.updateAssignmentWithTargets(assignmentId, {
      title: dto.title,
      description: dto.description,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      oneDriveUrl: dto.oneDriveUrl,
      status: dto.status,
      targetType: dto.targetType,
      targetGroupIds: dto.targetGroupIds,
    });
  }

  async listAssignments(userId: string, role: Role) {
    if (role === 'ADMIN') {
      return this.assignmentsRepo.listAssignmentsForAdmin();
    }

    // Student role: resolve active group
    const activeMembership = await this.groupsRepo.findActiveMembershipForUser(userId);
    const activeGroupId = activeMembership ? activeMembership.groupId : null;

    return this.assignmentsRepo.listPublishedAssignmentsForStudent(activeGroupId);
  }

  async getAssignmentById(userId: string, role: Role, assignmentId: string) {
    const assignment = await this.assignmentsRepo.findAssignmentById(assignmentId);
    if (!assignment) {
      throw ApiError.notFound('Assignment not found');
    }

    if (role === 'ADMIN') {
      return assignment;
    }

    // Check student visibility rules
    if (assignment.status !== 'PUBLISHED') {
      throw ApiError.notFound('Assignment not found');
    }

    const activeMembership = await this.groupsRepo.findActiveMembershipForUser(userId);
    const activeGroupId = activeMembership ? activeMembership.groupId : null;

    const hasAllStudentsTarget = assignment.targets.some((t) => t.targetType === 'ALL_STUDENTS');
    const hasGroupTarget =
      activeGroupId &&
      assignment.targets.some(
        (t) => t.targetType === 'SELECTED_GROUP' && t.groupId === activeGroupId
      );

    if (!hasAllStudentsTarget && !hasGroupTarget) {
      // Conceal untargeted assignment from unauthorized students
      throw ApiError.notFound('Assignment not found');
    }

    return assignment;
  }
}
