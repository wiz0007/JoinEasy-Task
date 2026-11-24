import { prisma } from '../../config/database.js';
import { GroupInvitation, Prisma, User } from '@prisma/client';

export class InvitationsRepository {
  async findUserByIdentifier(identifier: string): Promise<User | null> {
    const isEmail = identifier.includes('@');
    if (isEmail) {
      return prisma.user.findFirst({
        where: {
          email: { equals: identifier.toLowerCase().trim(), mode: 'insensitive' },
        },
      });
    }

    return prisma.user.findFirst({
      where: {
        studentId: identifier.trim(),
      },
    });
  }

  async findPendingInvitation(groupId: string, invitedUserId: string): Promise<GroupInvitation | null> {
    return prisma.groupInvitation.findFirst({
      where: {
        groupId,
        invitedUserId,
        status: 'PENDING',
      },
    });
  }

  async findInvitationById(id: string) {
    return prisma.groupInvitation.findUnique({
      where: { id },
      include: {
        group: {
          include: {
            members: { where: { status: 'ACTIVE' } },
            createdBy: { select: { id: true, name: true, email: true } },
          },
        },
        invitedUser: { select: { id: true, name: true, email: true, studentId: true } },
        invitedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async createInvitation(data: {
    groupId: string;
    invitedUserId: string;
    invitedById: string;
    expiresAt: Date;
  }): Promise<GroupInvitation> {
    return prisma.groupInvitation.create({
      data: {
        groupId: data.groupId,
        invitedUserId: data.invitedUserId,
        invitedById: data.invitedById,
        status: 'PENDING',
        expiresAt: data.expiresAt,
      },
    });
  }

  async listPendingInvitationsForUser(userId: string) {
    return prisma.groupInvitation.findMany({
      where: {
        invitedUserId: userId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            maxMembers: true,
            createdBy: { select: { id: true, name: true, email: true } },
            _count: { select: { members: { where: { status: 'ACTIVE' } } } },
          },
        },
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acceptInvitationTransaction(invitationId: string, userId: string, groupId: string) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Lock and check invitation
      const inv = await tx.groupInvitation.findUnique({
        where: { id: invitationId },
        include: { group: true },
      });

      if (!inv || inv.status !== 'PENDING') {
        throw new Error('INVITATION_NOT_PENDING');
      }

      if (inv.invitedUserId !== userId) {
        throw new Error('UNAUTHORIZED_INVITATION');
      }

      if (new Date() > inv.expiresAt) {
        await tx.groupInvitation.update({
          where: { id: invitationId },
          data: { status: 'EXPIRED' },
        });
        throw new Error('INVITATION_EXPIRED');
      }

      // 2. Check if student already belongs to ANY active group
      const existingMembership = await tx.groupMember.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
        },
      });

      if (existingMembership) {
        throw new Error('ALREADY_IN_ACTIVE_GROUP');
      }

      // 3. Check group capacity
      const activeMemberCount = await tx.groupMember.count({
        where: {
          groupId,
          status: 'ACTIVE',
        },
      });

      if (activeMemberCount >= inv.group.maxMembers) {
        throw new Error('GROUP_CAPACITY_REACHED');
      }

      // 4. Mark invitation as accepted
      const acceptedInvitation = await tx.groupInvitation.update({
        where: { id: invitationId },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date(),
        },
      });

      // 5. Create membership
      const membership = await tx.groupMember.create({
        data: {
          groupId,
          userId,
          role: 'MEMBER',
          status: 'ACTIVE',
        },
      });

      // 6. Invalidate other pending invitations for this student
      await tx.groupInvitation.updateMany({
        where: {
          invitedUserId: userId,
          status: 'PENDING',
          id: { not: invitationId },
        },
        data: {
          status: 'CANCELLED',
        },
      });

      return { invitation: acceptedInvitation, membership };
    });
  }

  async updateInvitationStatus(
    id: string,
    status: 'REJECTED' | 'CANCELLED'
  ): Promise<GroupInvitation> {
    return prisma.groupInvitation.update({
      where: { id },
      data: {
        status,
        respondedAt: new Date(),
      },
    });
  }
}
