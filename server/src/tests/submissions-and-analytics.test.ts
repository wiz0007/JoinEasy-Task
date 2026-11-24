import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../config/database.js';

const app = createApp();

describe('Sprint 2 — Submissions, Progress & Analytics Workflows', () => {
  let adminToken: string;
  let student1Token: string;
  let student2Token: string;
  let student3Token: string;

  let student1Id: string;
  let student2Id: string;
  let student3Id: string;

  let groupId: string;
  let assignmentAllId: string;
  let assignmentGroupId: string;

  beforeAll(async () => {
    // 1. Authenticate Admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'professor@joineazy.edu', password: 'Password123!' });
    adminToken = adminRes.body.data.accessToken;

    // 2. Authenticate Student 1
    const s1Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student1@joineazy.edu', password: 'Password123!' });
    student1Token = s1Res.body.data.accessToken;
    student1Id = s1Res.body.data.user.id;

    // 3. Authenticate Student 2
    const s2Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student2@joineazy.edu', password: 'Password123!' });
    student2Token = s2Res.body.data.accessToken;
    student2Id = s2Res.body.data.user.id;

    // 4. Authenticate Student 3
    const s3Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'charlie@joineazy.edu', password: 'Password123!' });
    student3Token = s3Res.body.data.accessToken;
    student3Id = s3Res.body.data.user.id;

    // Ensure clean group memberships for this suite
    await prisma.groupMember.deleteMany({
      where: { userId: { in: [student1Id, student2Id, student3Id] } },
    });

    // 5. Setup test group with student 1 (owner) and student 2 (member)
    const groupRes = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ name: `Sprint2 Test Group ${Date.now()}` });
    groupId = groupRes.body.data.id;

    // Invite & accept student 2
    const inviteRes = await request(app)
      .post(`/api/v1/groups/${groupId}/invitations`)
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ identifier: 'student2@joineazy.edu' });

    await request(app)
      .post(`/api/v1/invitations/${inviteRes.body.data.id}/accept`)
      .set('Authorization', `Bearer ${student2Token}`);

    // 6. Create Assignment 1 (Target: ALL_STUDENTS)
    const a1Res = await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: `Sprint 2 All Students Assignment ${Date.now()}`,
        description: 'Testing group confirmation workflows.',
        dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
        oneDriveUrl: 'https://onedrive.live.com/test-sprint2-all',
        status: 'PUBLISHED',
        targetType: 'ALL_STUDENTS',
      });
    assignmentAllId = a1Res.body.data.id;

    // 7. Create Assignment 2 (Target: SELECTED_GROUP)
    const a2Res = await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: `Sprint 2 Selected Group Assignment ${Date.now()}`,
        description: 'Testing selected group progress.',
        dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        oneDriveUrl: 'https://onedrive.live.com/test-sprint2-selected',
        status: 'PUBLISHED',
        targetType: 'SELECTED_GROUP',
        targetGroupIds: [groupId],
      });
    assignmentGroupId = a2Res.body.data.id;
  }, 30000);

  afterAll(async () => {
    // Cleanup created assignments and group
    if (assignmentAllId || assignmentGroupId) {
      await prisma.assignment.deleteMany({
        where: { id: { in: [assignmentAllId, assignmentGroupId].filter(Boolean) } },
      });
    }
    if (groupId) {
      await prisma.group.deleteMany({
        where: { id: groupId },
      });
    }
    await prisma.$disconnect();
  });

  describe('1. Submission Confirmation Workflows', () => {
    it('should confirm submission by active group member', async () => {
      const res = await request(app)
        .post(`/api/v1/assignments/${assignmentAllId}/groups/${groupId}/confirm`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assignmentId).toBe(assignmentAllId);
      expect(res.body.data.groupId).toBe(groupId);
      expect(res.body.data.confirmedBy.id).toBe(student1Id);
      expect(res.body.data.isLate).toBe(false);
    });

    it('should prevent duplicate submission confirmation by another group member', async () => {
      const res = await request(app)
        .post(`/api/v1/assignments/${assignmentAllId}/groups/${groupId}/confirm`)
        .set('Authorization', `Bearer ${student2Token}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject confirmation by student not in the group', async () => {
      const res = await request(app)
        .post(`/api/v1/assignments/${assignmentAllId}/groups/${groupId}/confirm`)
        .set('Authorization', `Bearer ${student3Token}`);

      expect(res.status).toBe(403);
    });

    it('should retrieve confirmed submission details for group member', async () => {
      const res = await request(app)
        .get(`/api/v1/assignments/${assignmentAllId}/groups/${groupId}/submission`)
        .set('Authorization', `Bearer ${student2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.confirmedBy.name).toBe('Alice Student');
    });
  });

  describe('2. Group Progress Tracking', () => {
    it('should accurately calculate group progress', async () => {
      const res = await request(app)
        .get(`/api/v1/groups/${groupId}/progress`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const summary = res.body.data.summary;
      expect(summary.total).toBeGreaterThanOrEqual(2);
      expect(summary.submitted).toBeGreaterThanOrEqual(1);
      expect(summary.progressPercentage).toBe(
        Math.round((summary.submitted / summary.total) * 100)
      );

      // Verify assignment status list
      const assignments = res.body.data.assignments;
      const submittedItem = assignments.find((a: any) => a.assignmentId === assignmentAllId);
      expect(submittedItem.status).toBe('SUBMITTED');
      expect(submittedItem.confirmation.confirmedBy.id).toBe(student1Id);
    });

    it('should reject unauthorized student from viewing another group progress', async () => {
      const res = await request(app)
        .get(`/api/v1/groups/${groupId}/progress`)
        .set('Authorization', `Bearer ${student3Token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('3. Professor Analytics & Dashboard', () => {
    it('should return global dashboard summary for Admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalAssignments).toBeGreaterThanOrEqual(2);
      expect(res.body.data.totalGroups).toBeGreaterThanOrEqual(1);
      expect(res.body.data.submittedPairs).toBeGreaterThanOrEqual(1);
      expect(res.body.data.overallCompletionRate).toBeGreaterThan(0);
    });

    it('should return assignment-wise analytics for Admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/analytics/assignments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const a1Analytics = res.body.data.find((a: any) => a.id === assignmentAllId);
      expect(a1Analytics).toBeDefined();
      expect(a1Analytics.submittedGroupsCount).toBeGreaterThanOrEqual(1);
    });

    it('should return group-wise performance analytics for Admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/analytics/groups')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const groupPerf = res.body.data.find((g: any) => g.id === groupId);
      expect(groupPerf).toBeDefined();
      expect(groupPerf.submittedCount).toBeGreaterThanOrEqual(1);
    });

    it('should return student-wise confirmation audit trail for Admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/analytics/students')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const studentRecord = res.body.data.find(
        (r: any) => r.studentId === student2Id && r.assignmentId === assignmentAllId
      );
      expect(studentRecord).toBeDefined();
      expect(studentRecord.status).toBe('SUBMITTED');
      expect(studentRecord.confirmedBy).toBe('Alice Student');
    });

    it('should block students from accessing admin analytics endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/admin/analytics/dashboard')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(403);
    });
  });
});
