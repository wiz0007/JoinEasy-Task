import { prisma } from '../../config/database.js';
import { Assignment, AssignmentStatus, AssignmentTargetType, Prisma } from '@prisma/client';

export class AssignmentsRepository {
  async createAssignmentWithTargets(data: {
    title: string;
    description: string;
    dueDate: Date;
    oneDriveUrl: string;
    createdById: string;
    status: AssignmentStatus;
    targetType: AssignmentTargetType;
    targetGroupIds?: string[];
  }): Promise<Assignment> {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const assignment = await tx.assignment.create({
        data: {
          title: data.title,
          description: data.description,
          dueDate: data.dueDate,
          oneDriveUrl: data.oneDriveUrl,
          createdById: data.createdById,
          status: data.status,
        },
      });

      if (data.targetType === 'ALL_STUDENTS') {
        await tx.assignmentTarget.create({
          data: {
            assignmentId: assignment.id,
            targetType: 'ALL_STUDENTS',
            groupId: null,
          },
        });
      } else if (data.targetGroupIds && data.targetGroupIds.length > 0) {
        // Distinct group IDs to avoid duplicate insertion
        const uniqueGroupIds = Array.from(new Set(data.targetGroupIds));
        await tx.assignmentTarget.createMany({
          data: uniqueGroupIds.map((groupId) => ({
            assignmentId: assignment.id,
            targetType: 'SELECTED_GROUP',
            groupId,
          })),
        });
      }

      return assignment;
    });
  }

  async updateAssignmentWithTargets(
    assignmentId: string,
    data: {
      title?: string;
      description?: string;
      dueDate?: Date;
      oneDriveUrl?: string;
      status?: AssignmentStatus;
      targetType?: AssignmentTargetType;
      targetGroupIds?: string[];
    }
  ): Promise<Assignment> {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const assignment = await tx.assignment.update({
        where: { id: assignmentId },
        data: {
          ...(data.title ? { title: data.title } : {}),
          ...(data.description ? { description: data.description } : {}),
          ...(data.dueDate ? { dueDate: data.dueDate } : {}),
          ...(data.oneDriveUrl ? { oneDriveUrl: data.oneDriveUrl } : {}),
          ...(data.status ? { status: data.status } : {}),
        },
      });

      // Update targets atomically if targetType was specified
      if (data.targetType) {
        // Remove existing targets
        await tx.assignmentTarget.deleteMany({
          where: { assignmentId },
        });

        if (data.targetType === 'ALL_STUDENTS') {
          await tx.assignmentTarget.create({
            data: {
              assignmentId,
              targetType: 'ALL_STUDENTS',
              groupId: null,
            },
          });
        } else if (data.targetGroupIds && data.targetGroupIds.length > 0) {
          const uniqueGroupIds = Array.from(new Set(data.targetGroupIds));
          await tx.assignmentTarget.createMany({
            data: uniqueGroupIds.map((groupId) => ({
              assignmentId,
              targetType: 'SELECTED_GROUP',
              groupId,
            })),
          });
        }
      }

      return assignment;
    });
  }

  async findAssignmentById(id: string) {
    return prisma.assignment.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        targets: {
          include: {
            group: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }

  async listAssignmentsForAdmin() {
    return prisma.assignment.findMany({
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        targets: {
          include: {
            group: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listPublishedAssignmentsForStudent(activeGroupId?: string | null) {
    // Return published assignments where target is ALL_STUDENTS OR student's active group is in SELECTED_GROUP
    return prisma.assignment.findMany({
      where: {
        status: 'PUBLISHED',
        targets: {
          some: {
            OR: [
              { targetType: 'ALL_STUDENTS' },
              ...(activeGroupId
                ? [
                    {
                      targetType: 'SELECTED_GROUP' as AssignmentTargetType,
                      groupId: activeGroupId,
                    },
                  ]
                : []),
            ],
          },
        },
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        targets: {
          include: {
            group: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }
}
