import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../config/database.js';

const app = createApp();

describe('Groups & Assignments Workflows', () => {
  let adminToken: string;
  let student1Token: string;
  let student2Token: string;
  let student3Token: string;

  let student1Id: string;
  let student2Id: string;
  let student3Id: string;

  let groupId: string;
  let invitationId: string;
  let assignmentAllId: string;
  let assignmentGroupOnlyId: string;

  beforeAll(async () => {
    // 1. Login Admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'professor@joineazy.edu', password: 'Password123!' });
    adminToken = adminRes.body.data.accessToken;

    // 2. Login Student 1
    const s1Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student1@joineazy.edu', password: 'Password123!' });
    student1Token = s1Res.body.data.accessToken;
    student1Id = s1Res.body.data.user.id;

    // 3. Login Student 2
    const s2Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student2@joineazy.edu', password: 'Password123!' });
    student2Token = s2Res.body.data.accessToken;
    student2Id = s2Res.body.data.user.id;

    // 4. Login Student 3
    const s3Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'charlie@joineazy.edu', password: 'Password123!' });
    student3Token = s3Res.body.data.accessToken;
    student3Id = s3Res.body.data.user.id;

    // Cleanup active group memberships for test students
    await prisma.groupMember.deleteMany({
      where: { userId: { in: [student1Id, student2Id, student3Id] } },
    });
  });

  afterAll(async () => {
    // Cleanup created assignments and groups
    if (assignmentAllId || assignmentGroupOnlyId) {
      await prisma.assignment.deleteMany({
        where: { id: { in: [assignmentAllId, assignmentGroupOnlyId].filter(Boolean) } },
      });
    }
    if (groupId) {
      await prisma.group.deleteMany({
        where: { id: groupId },
      });
    }
    await prisma.$disconnect();
  });

  describe('Group Management', () => {
    it('1. Student creates a new group and automatically becomes OWNER', async () => {
      const res = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ name: 'Alpha Distributed Group' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('Alpha Distributed Group');

      groupId = res.body.data.id;

      // Verify membership
      const myGroupRes = await request(app)
        .get('/api/v1/groups/me')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(myGroupRes.status).toBe(200);
      expect(myGroupRes.body.data.currentUserRole).toBe('OWNER');
      expect(myGroupRes.body.data.members.length).toBe(1);
    });

    it('2. Student cannot create a second group while already an active member', async () => {
      const res = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ name: 'Duplicate Group' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('3. Group Owner invites Student 2 by email', async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/invitations`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ identifier: 'student2@joineazy.edu' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.invitedUserId).toBe(student2Id);

      invitationId = res.body.data.id;
    });

    it('4. Group Owner cannot send duplicate pending invitation', async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/invitations`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ identifier: 'student2@joineazy.edu' });

      expect(res.status).toBe(409);
    });

    it('5. Invited Student 2 views received invitations and accepts', async () => {
      const listRes = await request(app)
        .get('/api/v1/invitations/me')
        .set('Authorization', `Bearer ${student2Token}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);

      // Accept invitation
      const acceptRes = await request(app)
        .post(`/api/v1/invitations/${invitationId}/accept`)
        .set('Authorization', `Bearer ${student2Token}`);

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.success).toBe(true);

      // Verify Student 2 is now active in group
      const s2GroupRes = await request(app)
        .get('/api/v1/groups/me')
        .set('Authorization', `Bearer ${student2Token}`);

      expect(s2GroupRes.status).toBe(200);
      expect(s2GroupRes.body.data.id).toBe(groupId);
      expect(s2GroupRes.body.data.currentUserRole).toBe('MEMBER');
    });

    it('6. Cannot accept already accepted invitation', async () => {
      const res = await request(app)
        .post(`/api/v1/invitations/${invitationId}/accept`)
        .set('Authorization', `Bearer ${student2Token}`);

      expect(res.status).toBe(409);
    });
  });

  describe('Assignment Management & Targeting', () => {
    it('1. Admin creates an assignment targeting ALL_STUDENTS', async () => {
      const res = await request(app)
        .post('/api/v1/assignments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Distributed Systems Milestone 1',
          description: 'Build RPC server and client module.',
          dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
          oneDriveUrl: 'https://onedrive.live.com/test-submission-all',
          status: 'PUBLISHED',
          targetType: 'ALL_STUDENTS',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      assignmentAllId = res.body.data.id;
    });

    it('2. Admin creates an assignment targeting SELECTED_GROUP only', async () => {
      const res = await request(app)
        .post('/api/v1/assignments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Selected Group Advanced Lab',
          description: 'Special assignment for Alpha Group.',
          dueDate: new Date(Date.now() + 86400000 * 14).toISOString(),
          oneDriveUrl: 'https://onedrive.live.com/test-submission-group',
          status: 'PUBLISHED',
          targetType: 'SELECTED_GROUP',
          targetGroupIds: [groupId],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      assignmentGroupOnlyId = res.body.data.id;
    });

    it('3. Student cannot create an assignment (Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/assignments')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          title: 'Student Attempt Assignment',
          description: 'Should fail',
          dueDate: new Date().toISOString(),
          oneDriveUrl: 'https://onedrive.live.com/fail',
          status: 'PUBLISHED',
          targetType: 'ALL_STUDENTS',
        });

      expect(res.status).toBe(403);
    });

    it('4. Student 1 (in targeted group) sees BOTH assignments', async () => {
      const res = await request(app)
        .get('/api/v1/assignments')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((a: any) => a.id);
      expect(ids).toContain(assignmentAllId);
      expect(ids).toContain(assignmentGroupOnlyId);
    });

    it('5. Student 3 (NOT in the targeted group) sees ONLY the ALL_STUDENTS assignment', async () => {
      const res = await request(app)
        .get('/api/v1/assignments')
        .set('Authorization', `Bearer ${student3Token}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((a: any) => a.id);
      expect(ids).toContain(assignmentAllId);
      expect(ids).not.toContain(assignmentGroupOnlyId);
    });

    it('6. Student 3 cannot access targeted assignment directly by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/assignments/${assignmentGroupOnlyId}`)
        .set('Authorization', `Bearer ${student3Token}`);

      expect(res.status).toBe(404);
    });
  });
});
