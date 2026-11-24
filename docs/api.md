# Joineazy API Documentation — Sprint 1

Base URL: `/api/v1`

## 1. Authentication Endpoints

### POST `/auth/register`
- **Permission**: Public (Student only)
- **Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@joineazy.edu",
    "studentId": "STU-100",
    "password": "Password123!",
    "confirmPassword": "Password123!"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Registration successful",
    "data": {
      "user": { "id": "...", "name": "Jane Doe", "email": "jane@joineazy.edu", "role": "STUDENT" },
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
  ```

### POST `/auth/login`
- **Permission**: Public
- **Body**:
  ```json
  {
    "email": "professor@joineazy.edu",
    "password": "Password123!"
  }
  ```
- **Response (200 OK)**: Returns tokens and user object.

### POST `/auth/refresh`
- **Permission**: Public with valid refresh token (via HttpOnly cookie or request body)
- **Response (200 OK)**: Returns rotated `accessToken` and `refreshToken`.

### POST `/auth/logout`
- **Permission**: Authenticated
- **Response (200 OK)**: Invalidates refresh token family and clears session cookie.

### GET `/auth/me`
- **Permission**: Authenticated
- **Response (200 OK)**: Returns current user profile and active group membership.

---

## 2. Group Endpoints

### POST `/groups`
- **Permission**: Student
- **Body**: `{ "name": "Algorithms Group A" }`
- **Response (201 Created)**: Creates group and creator's OWNER membership transactionally.

### GET `/groups/me`
- **Permission**: Student
- **Response (200 OK)**: Returns current student's active group, member list, and pending invitations (if owner).

### GET `/groups/all`
- **Permission**: Admin
- **Response (200 OK)**: Returns all active student groups.

### PATCH `/groups/:groupId`
- **Permission**: Group Owner
- **Body**: `{ "name": "Renamed Group" }`

### DELETE `/groups/:groupId/members/:userId`
- **Permission**: Group Owner
- **Response (204 No Content)**: Removes member from group.

---

## 3. Group Invitation Endpoints

### POST `/groups/:groupId/invitations`
- **Permission**: Group Owner
- **Body**: `{ "identifier": "student2@joineazy.edu" }` or `{ "identifier": "STU-002" }`
- **Response (201 Created)**: Returns invitation details.

### GET `/invitations/me`
- **Permission**: Student
- **Response (200 OK)**: Returns pending invitations received by the requesting student.

### POST `/invitations/:invitationId/accept`
- **Permission**: Invited Student
- **Response (200 OK)**: Atomically marks invitation accepted and creates membership.

### POST `/invitations/:invitationId/reject`
- **Permission**: Invited Student
- **Response (200 OK)**: Marks invitation rejected.

### DELETE `/groups/:groupId/invitations/:invitationId`
- **Permission**: Group Owner
- **Response (204 No Content)**: Cancels pending invitation.

---

## 4. Assignment Endpoints

### POST `/assignments`
- **Permission**: Admin
- **Body**:
  ```json
  {
    "title": "Lab 1: Distributed Algorithms",
    "description": "Complete problem sets 1 to 3.",
    "dueDate": "2026-12-01T23:59:59.000Z",
    "oneDriveUrl": "https://onedrive.live.com/submission-link",
    "status": "PUBLISHED",
    "targetType": "SELECTED_GROUP",
    "targetGroupIds": ["uuid-of-group"]
  }
  ```

### GET `/assignments`
- **Permission**: Authenticated (Role-aware visibility)
  - Admin: views all assignments (DRAFT, PUBLISHED, ARCHIVED).
  - Student: views only PUBLISHED assignments targeting ALL_STUDENTS or their active group.

### GET `/assignments/:assignmentId`
- **Permission**: Authorized user (Student must have target permission; Admin can view any).

### PATCH `/assignments/:assignmentId`
- **Permission**: Admin
- **Body**: Partial update of title, description, due date, OneDrive URL, status, or targeting.
