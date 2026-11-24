import { prisma } from '../../config/database.js';
import { Group, GroupMember, Prisma } from '@prisma/client';

export class GroupsRepository {
  async findActiveMembershipForUser(userId: string): Promise<GroupMember | null> {
    return prisma.groupMember.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        group: true,
      },
    });
  }

  async findGroupById(groupId: string) {
    return prisma.group.findUnique({
      where: { id: groupId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, studentId: true },
        },
        members: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: { id: true, name: true, email: true, studentId: true },
            },
          },
        },
        invitations: {
          where: { status: 'PENDING' },
          include: {
            invitedUser: {
              select: { id: true, name: true, email: true, studentId: true },
            },
          },
        },
      },
    });
  }

  async createGroupWithOwner(
    name: string,
    createdById: string,
    maxMembers = 5
  ): Promise<Group & { members: GroupMember[] }> {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Concurrency check inside transaction: ensure user is not already active in a group
      const existing = await tx.groupMember.findFirst({
        where: {
          userId: createdById,
          status: 'ACTIVE',
        },
      });

      if (existing) {
        throw new Error('ALREADY_IN_GROUP');
      }

      const group = await tx.group.create({
        data: {
          name,
          createdById,
          maxMembers,
          status: 'ACTIVE',
        },
      });

      const member = await tx.groupMember.create({
        data: {
          groupId: group.id,
          userId: createdById,
          role: 'OWNER',
          status: 'ACTIVE',
        },
      });

      return { ...group, members: [member] };
    });
  }

  async updateGroupName(groupId: string, name: string): Promise<Group> {
    return prisma.group.update({
      where: { id: groupId },
      data: { name },
    });
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    await prisma.groupMember.update({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
      data: {
        status: 'INACTIVE',
      },
    });
  }

  async countActiveMembers(groupId: string): Promise<number> {
    return prisma.groupMember.count({
      where: {
        groupId,
        status: 'ACTIVE',
      },
    });
  }

  async listAllActiveGroups() {
    return prisma.group.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: { members: { where: { status: 'ACTIVE' } } },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}
