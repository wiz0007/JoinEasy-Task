import { prisma } from '../../config/database.js';

export class AnalyticsService {
  async getAdminDashboardSummary() {
    // 1. Fetch all active groups
    const activeGroups = await prisma.group.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
    });
    const totalActiveGroups = activeGroups.length;

    // 2. Fetch all published assignments with targets
    const assignments = await prisma.assignment.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        targets: true,
        submissionConfirmations: {
          select: { groupId: true, isLate: true, confirmedAt: true },
        },
      },
    });

    const now = Date.now();
    let totalApplicablePairs = 0;
    let submittedPairs = 0;
    let overduePairs = 0;
    let pendingPairs = 0;

    for (const assignment of assignments) {
      const isPastDue = now > new Date(assignment.dueDate).getTime();
      const isAllStudents = assignment.targets.some((t) => t.targetType === 'ALL_STUDENTS');

      // Determine targeted groups for this assignment
      let targetedGroupIds: string[] = [];
      if (isAllStudents) {
        targetedGroupIds = activeGroups.map((g) => g.id);
      } else {
        const selectedIds = assignment.targets
          .filter((t) => t.targetType === 'SELECTED_GROUP' && t.groupId)
          .map((t) => t.groupId as string);
        // Only consider active groups
        targetedGroupIds = activeGroups
          .filter((g) => selectedIds.includes(g.id))
          .map((g) => g.id);
      }

      const confirmedGroupIds = new Set(
        assignment.submissionConfirmations.map((c) => c.groupId)
      );

      for (const groupId of targetedGroupIds) {
        totalApplicablePairs++;
        if (confirmedGroupIds.has(groupId)) {
          submittedPairs++;
        } else if (isPastDue) {
          overduePairs++;
        } else {
          pendingPairs++;
        }
      }
    }

    const overallCompletionRate =
      totalApplicablePairs === 0
        ? 0
        : Math.round((submittedPairs / totalApplicablePairs) * 100);

    return {
      totalAssignments: assignments.length,
      totalGroups: totalActiveGroups,
      totalApplicablePairs,
      submittedPairs,
      pendingPairs,
      overduePairs,
      overallCompletionRate,
    };
  }

  async getAssignmentWiseAnalytics() {
    const activeGroups = await prisma.group.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
    });

    const assignments = await prisma.assignment.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        targets: { include: { group: { select: { id: true, name: true } } } },
        submissionConfirmations: {
          include: {
            group: { select: { id: true, name: true } },
            confirmedBy: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const now = Date.now();

    return assignments.map((a) => {
      const isPastDue = now > new Date(a.dueDate).getTime();
      const isAllStudents = a.targets.some((t) => t.targetType === 'ALL_STUDENTS');

      let applicableGroups: { id: string; name: string }[] = [];
      if (isAllStudents) {
        applicableGroups = activeGroups;
      } else {
        applicableGroups = a.targets
          .filter((t) => t.targetType === 'SELECTED_GROUP' && t.group)
          .map((t) => t.group!);
      }

      const confirmedMap = new Map(
        a.submissionConfirmations.map((c) => [c.groupId, c])
      );

      let submittedCount = 0;
      let overdueCount = 0;
      let pendingCount = 0;

      const groupBreakdown = applicableGroups.map((g) => {
        const conf = confirmedMap.get(g.id);
        let status: 'SUBMITTED' | 'OVERDUE' | 'PENDING';
        if (conf) {
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
          groupId: g.id,
          groupName: g.name,
          status,
          confirmation: conf
            ? {
                confirmedAt: conf.confirmedAt,
                isLate: conf.isLate,
                confirmedBy: conf.confirmedBy,
              }
            : null,
        };
      });

      const totalTargeted = applicableGroups.length;
      const completionRate =
        totalTargeted === 0 ? 0 : Math.round((submittedCount / totalTargeted) * 100);

      return {
        id: a.id,
        title: a.title,
        dueDate: a.dueDate,
        targetType: isAllStudents ? 'ALL_STUDENTS' : 'SELECTED_GROUP',
        totalTargetedGroups: totalTargeted,
        submittedGroupsCount: submittedCount,
        pendingGroupsCount: pendingCount,
        overdueGroupsCount: overdueCount,
        completionRate,
        groups: groupBreakdown,
      };
    });
  }

  async getGroupWiseAnalytics() {
    const groups = await prisma.group.findMany({
      where: { status: 'ACTIVE' },
      include: {
        members: {
          where: { status: 'ACTIVE' },
          include: {
            user: { select: { id: true, name: true, email: true, studentId: true } },
          },
        },
        submissionConfirmations: true,
      },
      orderBy: { name: 'asc' },
    });

    const publishedAssignments = await prisma.assignment.findMany({
      where: { status: 'PUBLISHED' },
      include: { targets: true },
    });

    const now = Date.now();

    return groups.map((g) => {
      // Find applicable assignments for group g
      const applicable = publishedAssignments.filter((a) => {
        const forAll = a.targets.some((t) => t.targetType === 'ALL_STUDENTS');
        const forGroup = a.targets.some(
          (t) => t.targetType === 'SELECTED_GROUP' && t.groupId === g.id
        );
        return forAll || forGroup;
      });

      const confirmedAssignmentIds = new Set(
        g.submissionConfirmations.map((c) => c.assignmentId)
      );

      let submitted = 0;
      let overdue = 0;
      let pending = 0;

      applicable.forEach((a) => {
        if (confirmedAssignmentIds.has(a.id)) {
          submitted++;
        } else if (now > new Date(a.dueDate).getTime()) {
          overdue++;
        } else {
          pending++;
        }
      });

      const total = applicable.length;
      const completionRate = total === 0 ? 0 : Math.round((submitted / total) * 100);

      return {
        id: g.id,
        name: g.name,
        activeMembersCount: g.members.length,
        members: g.members.map((m) => m.user),
        applicableAssignmentsCount: total,
        submittedCount: submitted,
        pendingCount: pending,
        overdueCount: overdue,
        completionRate,
      };
    });
  }

  async getStudentWiseAnalytics() {
    // Return all students in active groups and their assignment confirmation statuses
    const groups = await prisma.group.findMany({
      where: { status: 'ACTIVE' },
      include: {
        members: {
          where: { status: 'ACTIVE' },
          include: {
            user: { select: { id: true, name: true, email: true, studentId: true } },
          },
        },
        submissionConfirmations: {
          include: {
            confirmedBy: { select: { id: true, name: true } },
            assignment: { select: { id: true, title: true, dueDate: true } },
          },
        },
      },
    });

    const publishedAssignments = await prisma.assignment.findMany({
      where: { status: 'PUBLISHED' },
      include: { targets: true },
    });

    const now = Date.now();
    const rows: any[] = [];

    for (const group of groups) {
      const applicable = publishedAssignments.filter((a) => {
        const forAll = a.targets.some((t) => t.targetType === 'ALL_STUDENTS');
        const forGroup = a.targets.some(
          (t) => t.targetType === 'SELECTED_GROUP' && t.groupId === group.id
        );
        return forAll || forGroup;
      });

      const confMap = new Map(
        group.submissionConfirmations.map((c) => [c.assignmentId, c])
      );

      for (const member of group.members) {
        for (const assignment of applicable) {
          const conf = confMap.get(assignment.id);
          const isPastDue = now > new Date(assignment.dueDate).getTime();

          let status: 'SUBMITTED' | 'OVERDUE' | 'PENDING';
          if (conf) {
            status = 'SUBMITTED';
          } else if (isPastDue) {
            status = 'OVERDUE';
          } else {
            status = 'PENDING';
          }

          rows.push({
            studentId: member.user.id,
            studentName: member.user.name,
            studentEmail: member.user.email,
            studentCode: member.user.studentId || '—',
            groupId: group.id,
            groupName: group.name,
            assignmentId: assignment.id,
            assignmentTitle: assignment.title,
            dueDate: assignment.dueDate,
            status,
            confirmedBy: conf ? conf.confirmedBy.name : null,
            confirmedAt: conf ? conf.confirmedAt : null,
            isLate: conf ? conf.isLate : false,
          });
        }
      }
    }

    return rows;
  }
}
