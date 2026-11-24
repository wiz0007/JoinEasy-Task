# Joineazy Database Schema & ERD — Sprint 1 & 2

## Complete Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ RefreshToken : owns
    User ||--o{ Group : creates
    User ||--o{ GroupMember : joins
    User ||--o{ GroupInvitation : sends
    User ||--o{ GroupInvitation : receives
    User ||--o{ Assignment : creates
    User ||--o{ SubmissionConfirmation : confirms
    Group ||--o{ GroupMember : contains
    Group ||--o{ GroupInvitation : has
    Group ||--o{ AssignmentTarget : targeted_by
    Group ||--o{ SubmissionConfirmation : receives
    Assignment ||--o{ AssignmentTarget : targets
    Assignment ||--o{ SubmissionConfirmation : confirmed_for

    User {
        uuid id PK
        string name
        string email UK
        string passwordHash
        enum role
        string studentId UK
        enum status
        datetime createdAt
        datetime updatedAt
    }

    RefreshToken {
        uuid id PK
        uuid userId FK
        string tokenHash UK
        string familyId
        boolean isRevoked
        datetime expiresAt
        datetime createdAt
    }

    Group {
        uuid id PK
        string name
        uuid createdById FK
        enum status
        int maxMembers
        datetime createdAt
        datetime updatedAt
    }

    GroupMember {
        uuid id PK
        uuid groupId FK
        uuid userId FK
        enum role
        enum status
        datetime joinedAt
        datetime createdAt
    }

    GroupInvitation {
        uuid id PK
        uuid groupId FK
        uuid invitedUserId FK
        uuid invitedById FK
        enum status
        datetime expiresAt
        datetime respondedAt
        datetime createdAt
    }

    Assignment {
        uuid id PK
        string title
        text description
        datetime dueDate
        string oneDriveUrl
        uuid createdById FK
        enum status
        datetime createdAt
        datetime updatedAt
    }

    AssignmentTarget {
        uuid id PK
        uuid assignmentId FK
        enum targetType
        uuid groupId FK
        datetime createdAt
    }

    SubmissionConfirmation {
        uuid id PK
        uuid assignmentId FK
        uuid groupId FK
        uuid confirmedById FK
        datetime confirmedAt
        boolean isLate
        datetime createdAt
        datetime updatedAt
    }
```

## Relational Constraints & Invariants

1. **Unique Email**: `User(email)` is case-insensitively unique.
2. **Unique Student ID**: `User(studentId)` is unique when provided.
3. **Unique Group Membership**: `GroupMember(groupId, userId)` ensures no student is added twice to the same group.
4. **Single Active Group Rule**: Business service transactions enforce that a student cannot have more than one active membership simultaneously.
5. **Atomic Invitation Acceptance**: Invitation acceptance updates invitation status to `ACCEPTED` and inserts the `GroupMember` in an isolated database transaction, checking max group capacity (default 5).
6. **Audience Targeting Integrity**:
   - `ALL_STUDENTS`: `targetType = 'ALL_STUDENTS'` and `groupId = null`.
   - `SELECTED_GROUP`: `targetType = 'SELECTED_GROUP'` with valid active `groupId`.
7. **Unique Group Submission**: `SubmissionConfirmation(assignmentId, groupId)` is unique, enforcing that each group has exactly one confirmation record per assignment.
8. **Confirmation Auditability**: `confirmedById` records the exact student who verified the submission, with `isLate` preserved.
