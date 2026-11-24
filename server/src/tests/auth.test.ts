import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../config/database.js';

const app = createApp();

describe('Authentication & Authorization Module', () => {
  const testStudentEmail = `test.student.${Date.now()}@joineazy.edu`;
  let accessToken: string;
  let refreshToken: string;

  afterAll(async () => {
    // Cleanup created test records
    await prisma.user.deleteMany({
      where: { email: { contains: 'test.student.' } },
    });
    await prisma.$disconnect();
  });

  it('1. Register: should successfully register a new student', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Integration Test Student',
        email: testStudentEmail,
        studentId: `STU-${Date.now()}`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.role).toBe('STUDENT');
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();

    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('2. Register: should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Another Student',
        email: testStudentEmail,
        studentId: `STU-DIFF-${Date.now()}`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('3. Register: should reject password confirmation mismatch', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Mismatch Student',
        email: `mismatch.${Date.now()}@joineazy.edu`,
        studentId: `STU-MIS-${Date.now()}`,
        password: 'Password123!',
        confirmPassword: 'WrongPassword!',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('4. Login: should successfully authenticate seeded admin', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'professor@joineazy.edu',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('ADMIN');
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('5. Login: should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testStudentEmail,
        password: 'WrongPassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('6. Me: should access protected profile with valid access token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testStudentEmail);
  });

  it('7. Me: should reject unauthorized request without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('8. Refresh: should rotate refresh token and issue new access token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();

    // Old token should now be revoked; reuse attempt should fail
    const reuseRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(reuseRes.status).toBe(401);
  });
});
