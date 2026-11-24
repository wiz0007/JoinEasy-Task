import { InvitationsRepository } from './invitations.repository.js';
import { GroupsRepository } from '../groups/groups.repository.js';
import { CreateInvitationDto } from './invitations.schema.js';
import { ApiError } from '../../utils/api-error.js';

export class InvitationsService {
  constructor(
    private readonly invitationsRepo: InvitationsRepository = new InvitationsRepository(),
    private readonly groupsRepo: GroupsRepository = new GroupsRepository()
  ) {}

  async createInvitation(ownerId: string, groupId: string, dto: CreateInvitationDto) {
    // 1. Verify group exists and owner is indeed the OWNER of this group
    const group = await this.groupsRepo.findGroupById(groupId);
    if (!group) {
      throw ApiError.notFound('Group not found');
    }

    const ownerMembership = group.members.find(
      (m) => m.userId === ownerId && m.status === 'ACTIVE' && m.role === 'OWNER'
    );
    if (!ownerMembership) {
      throw ApiError.forbidden('Only the group owner can invite members');
    }

    // 2. Check group capacity
    const activeCount = group.members.filter((m) => m.status === 'ACTIVE').length;
    if (activeCount >= group.maxMembers) {
      throw ApiError.conflict('Group has reached maximum capacity');
    }

    // 3. Resolve target student
    const targetUser = await this.invitationsRepo.findUserByIdentifier(dto.identifier);
    if (!targetUser) {
      throw ApiError.notFound('Student not found with the provided identifier');
    }

    if (targetUser.role !== 'STUDENT') {
      throw ApiError.badRequest('Cannot invite an administrator to a student group');
    }

    if (targetUser.status !== 'ACTIVE') {
      throw ApiError.badRequest('Cannot invite an inactive user account');
    }

    if (targetUser.id === ownerId) {
      throw ApiError.badRequest('You cannot invite yourself');
    }

    // 4. Check if student is already in this group
    const alreadyInThisGroup = group.members.some(
      (m) => m.userId === targetUser.id && m.status === 'ACTIVE'
    );
    if (alreadyInThisGroup) {
      throw ApiError.conflict('This student is already a member of this group');
    }

    // 5. Check if student already belongs to ANY active group
    const existingGroup = await this.groupsRepo.findActiveMembershipForUser(targetUser.id);
    if (existingGroup) {
      throw ApiError.conflict('This student already belongs to an active group');
    }

    // 6. Check for duplicate pending invitation
    const existingPending = await this.invitationsRepo.findPendingInvitation(groupId, targetUser.id);
    if (existingPending) {
      throw ApiError.conflict('A pending invitation already exists for this student');
    }

    // 7. Set expiration (e.g. 7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return this.invitationsRepo.createInvitation({
      groupId,
      invitedUserId: targetUser.id,
      invitedById: ownerId,
      expiresAt,
    });
  }

  async getMyInvitations(userId: string) {
    return this.invitationsRepo.listPendingInvitationsForUser(userId);
  }

  async acceptInvitation(userId: string, invitationId: string) {
    const invitation = await this.invitationsRepo.findInvitationById(invitationId);
    if (!invitation) {
      throw ApiError.notFound('Invitation not found');
    }

    if (invitation.invitedUserId !== userId) {
      throw ApiError.forbidden('You are not authorized to accept this invitation');
    }

    if (invitation.status !== 'PENDING') {
      throw ApiError.conflict(`Cannot accept an invitation with status: ${invitation.status}`);
    }

    try {
      const result = await this.invitationsRepo.acceptInvitationTransaction(
        invitationId,
        userId,
        invitation.groupId
      );
      return result;
    } catch (err: any) {
      if (err.message === 'INVITATION_NOT_PENDING') {
        throw ApiError.conflict('Invitation is no longer pending');
      }
      if (err.message === 'INVITATION_EXPIRED') {
        throw ApiError.conflict('Invitation has expired');
      }
      if (err.message === 'ALREADY_IN_ACTIVE_GROUP') {
        throw ApiError.conflict('You already belong to an active group');
      }
      if (err.message === 'GROUP_CAPACITY_REACHED') {
        throw ApiError.conflict('Group has reached maximum capacity');
      }
      throw err;
    }
  }

  async rejectInvitation(userId: string, invitationId: string) {
    const invitation = await this.invitationsRepo.findInvitationById(invitationId);
    if (!invitation) {
      throw ApiError.notFound('Invitation not found');
    }

    if (invitation.invitedUserId !== userId) {
      throw ApiError.forbidden('You are not authorized to reject this invitation');
    }

    if (invitation.status !== 'PENDING') {
      throw ApiError.conflict(`Cannot reject an invitation with status: ${invitation.status}`);
    }

    return this.invitationsRepo.updateInvitationStatus(invitationId, 'REJECTED');
  }

  async cancelInvitation(ownerId: string, groupId: string, invitationId: string) {
    const group = await this.groupsRepo.findGroupById(groupId);
    if (!group) {
      throw ApiError.notFound('Group not found');
    }

    const isOwner = group.members.some(
      (m) => m.userId === ownerId && m.status === 'ACTIVE' && m.role === 'OWNER'
    );
    if (!isOwner) {
      throw ApiError.forbidden('Only the group owner can cancel invitations');
    }

    const invitation = await this.invitationsRepo.findInvitationById(invitationId);
    if (!invitation || invitation.groupId !== groupId) {
      throw ApiError.notFound('Invitation not found in this group');
    }

    if (invitation.status !== 'PENDING') {
      throw ApiError.conflict(`Cannot cancel an invitation with status: ${invitation.status}`);
    }

    return this.invitationsRepo.updateInvitationStatus(invitationId, 'CANCELLED');
  }
}
