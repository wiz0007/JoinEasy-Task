# Joineazy API Documentation — Complete System

Base URL: `/api/v1`

## 1. Authentication Endpoints

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public (Student) | Registers student account with Argon2id hash |
| `POST` | `/auth/login` | Public | Authenticates user; issues access + refresh tokens |
| `POST` | `/auth/refresh` | Public (Refresh Token) | Rotates refresh token within family |
| `POST` | `/auth/logout` | Authenticated | Revokes refresh token session |
| `GET` | `/auth/me` | Authenticated | Returns authenticated user profile and active group |

---

## 2. Group Endpoints

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `POST` | `/groups` | Student | Creates group and OWNER membership atomically |
| `GET` | `/groups/me` | Student | Returns active group and member list |
| `GET` | `/groups/all` | Admin | Returns all registered groups |
| `GET` | `/groups/:groupId` | Member / Admin | Returns group details |
| `PATCH` | `/groups/:groupId` | Group Owner | Updates group name |
| `DELETE` | `/groups/:groupId/members/:userId` | Group Owner | Removes member from group |

---

## 3. Group Invitation Endpoints

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `POST` | `/groups/:groupId/invitations` | Group Owner | Invites student by email or student ID |
| `GET` | `/invitations/me` | Student | Lists pending invitations received |
| `POST` | `/invitations/:invitationId/accept` | Invited Student | Accepts invitation and creates membership |
| `POST` | `/invitations/:invitationId/reject` | Invited Student | Rejects invitation |
| `DELETE` | `/groups/:groupId/invitations/:invitationId` | Group Owner | Cancels pending invitation |

---

## 4. Assignment Endpoints

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `POST` | `/assignments` | Admin | Creates assignment with audience targeting |
| `GET` | `/assignments` | Authenticated | Role-aware listing (Student sees applicable only) |
| `GET` | `/assignments/:assignmentId` | Authorized | Returns assignment details |
| `PATCH` | `/assignments/:assignmentId` | Admin | Updates assignment details or targets |

---

## 5. Submission & Progress Endpoints (Sprint 2)

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `POST` | `/assignments/:assignmentId/groups/:groupId/confirm` | Active Group Member | Confirms group submission ("Yes, I have submitted") |
| `GET` | `/assignments/:assignmentId/groups/:groupId/submission` | Group Member / Admin | Returns confirmed submission details |
| `GET` | `/groups/:groupId/progress` | Group Member / Admin | Returns group assignment progress and completion % |
| `GET` | `/groups/:groupId/submissions` | Group Member / Admin | Lists all confirmed submissions for group |

---

## 6. Professor Analytics Endpoints (Sprint 2)

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/admin/analytics/dashboard` | Admin | Global summary metrics (assignments, groups, completion %) |
| `GET` | `/admin/analytics/assignments` | Admin | Assignment-wise completion breakdown |
| `GET` | `/admin/analytics/groups` | Admin | Group-wise performance metrics |
| `GET` | `/admin/analytics/students` | Admin | Student-wise confirmation audit trail |
