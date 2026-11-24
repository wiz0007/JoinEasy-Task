import { GroupsRepository } from './groups.repository.js';
import { CreateGroupDto, UpdateGroupDto } from './groups.schema.js';
import { ApiError } from '../../utils/api-error.js';
import { env } from '../../config/env.js';
import { Role } from '@prisma/client';

export class GroupsService {
  constructor(private readonly groupsRepo: GroupsRepository = new GroupsRepository()) {}

  async createGroup(userId: string, dto: CreateGroupDto) {
    // Check if user already belongs to an active group
    const existingMembership = await this.groupsRepo.findActiveMembershipForUser(userId);
    if (existingMembership) {
      throw ApiError.conflict('You are already an active member of a group. You cannot create another group.');
    }

    try {
      const group = await this.groupsRepo.createGroupWithOwner(
        dto.name,
        userId,
        env.MAX_GROUP_MEMBERS
      );
      return group;
    } catch (err: any) {
      if (err.message === 'ALREADY_IN_GROUP') {
        throw ApiError.conflict('You are already an active member of a group.');
      }
      throw err;
    }
  }

  async getMyGroup(userId: string) {
    const membership = await this.groupsRepo.findActiveMembershipForUser(userId);
    if (!membership) {
      return null;
    }

    const group = await this.groupsRepo.findGroupById(membership.groupId);
    if (!group || group.status !== 'ACTIVE') {
      return null;
    }

    const isOwner = membership.role === 'OWNER';

    return {
      id: group.id,
      name: group.name,
      status: group.status,
      maxMembers: group.maxMembers,
      currentUserRole: membership.role,
      createdBy: group.createdBy,
      members: group.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        status: m.status,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
      // Only group owner can view pending invitations
      invitations: isOwner
        ? group.invitations.map((inv) => ({
            id: inv.id,
            status: inv.status,
            expiresAt: inv.expiresAt,
            createdAt: inv.createdAt,
            invitedUser: inv.invitedUser,
          }))
        : [],
    };
  }

  async getGroupById(userId: string, role: Role, groupId: string) {
    const group = await this.groupsRepo.findGroupById(groupId);
    if (!group) {
      throw ApiError.notFound('Group not found');
    }

    // Role-based authorization: Admins can view any group; students must be members of the group
    const membership = group.members.find((m) => m.userId === userId && m.status === 'ACTIVE');
    if (role !== 'ADMIN' && !membership) {
      throw ApiError.forbidden('You are not authorized to view this group');
    }

    const isOwner = membership?.role === 'OWNER';

    return {
      id: group.id,
      name: group.name,
      status: group.status,
      maxMembers: group.maxMembers,
      currentUserRole: membership?.role || null,
      createdBy: group.createdBy,
      members: group.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        status: m.status,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
      invitations:
        isOwner || role === 'ADMIN'
          ? group.invitations.map((inv) => ({
              id: inv.id,
              status: inv.status,
              expiresAt: inv.expiresAt,
              createdAt: inv.createdAt,
              invitedUser: inv.invitedUser,
            }))
          : [],
    };
  }

  async updateGroup(userId: string, groupId: string, dto: UpdateGroupDto) {
    const group = await this.groupsRepo.findGroupById(groupId);
    if (!group) {
      throw ApiError.notFound('Group not found');
    }

    const membership = group.members.find((m) => m.userId === userId && m.status === 'ACTIVE');
    if (!membership || membership.role !== 'OWNER') {
      throw ApiError.forbidden('Only the group owner can update the group');
    }

    return this.groupsRepo.updateGroupName(groupId, dto.name);
  }

  async removeMember(userId: string, groupId: string, targetUserId: string) {
    const group = await this.groupsRepo.findGroupById(groupId);
    if (!group) {
      throw ApiError.notFound('Group not found');
    }

    const requesterMembership = group.members.find((m) => m.userId === userId && m.status === 'ACTIVE');
    if (!requesterMembership || requesterMembership.role !== 'OWNER') {
      throw ApiError.forbidden('Only the group owner can remove members');
    }

    if (userId === targetUserId) {
      throw ApiError.badRequest('The owner cannot remove themselves from the group');
    }

    const targetMembership = group.members.find((m) => m.userId === targetUserId && m.status === 'ACTIVE');
    if (!targetMembership) {
      throw ApiError.notFound('Member not found in this group');
    }

    await this.groupsRepo.removeMember(groupId, targetUserId);
  }

  async listGroupsForAdmin() {
    return this.groupsRepo.listAllActiveGroups();
  }
}
