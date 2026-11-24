import { prisma } from '../../config/database.js';
import { SubmissionConfirmation, Prisma } from '@prisma/client';

export class SubmissionsRepository {
  async findConfirmation(
    assignmentId: string,
    groupId: string
  ): Promise<SubmissionConfirmation | null> {
    return prisma.submissionConfirmation.findUnique({
      where: {
        assignmentId_groupId: {
          assignmentId,
          groupId,
        },
      },
      include: {
        confirmedBy: {
          select: { id: true, name: true, email: true, studentId: true },
        },
      },
    });
  }

  async createConfirmation(data: {
    assignmentId: string;
    groupId: string;
    confirmedById: string;
    isLate: boolean;
  }): Promise<SubmissionConfirmation> {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Concurrency check inside transaction
      const existing = await tx.submissionConfirmation.findUnique({
        where: {
          assignmentId_groupId: {
            assignmentId: data.assignmentId,
            groupId: data.groupId,
          },
        },
      });

      if (existing) {
        throw new Error('ALREADY_CONFIRMED');
      }

      return tx.submissionConfirmation.create({
        data: {
          assignmentId: data.assignmentId,
          groupId: data.groupId,
          confirmedById: data.confirmedById,
          isLate: data.isLate,
        },
        include: {
          confirmedBy: {
            select: { id: true, name: true, email: true, studentId: true },
          },
        },
      });
    });
  }

  async listConfirmationsForGroup(groupId: string) {
    return prisma.submissionConfirmation.findMany({
      where: { groupId },
      include: {
        confirmedBy: {
          select: { id: true, name: true, email: true, studentId: true },
        },
        assignment: {
          select: { id: true, title: true, dueDate: true, status: true },
        },
      },
      orderBy: { confirmedAt: 'desc' },
    });
  }

  async listConfirmationsForAssignment(assignmentId: string) {
    return prisma.submissionConfirmation.findMany({
      where: { assignmentId },
      include: {
        group: {
          select: { id: true, name: true },
        },
        confirmedBy: {
          select: { id: true, name: true, email: true, studentId: true },
        },
      },
    });
  }
}
