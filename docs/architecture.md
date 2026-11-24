# Joineazy System Architecture — Sprints 1 & 2

## Overview

Joineazy is a production-grade modular monolith implementing a Student, Group & Assignment Management System with role-based access control, submission confirmation, progress tracking, and performance analytics.

```
Client (React 18 + Vite + Tailwind CSS + TanStack Query)
   │
   ▼ REST API (/api/v1)
Express Server Application
   │
   ├── Helmet & CORS Security Middlewares
   ├── Cookie Parser & Rate Limiter
   ├── Authentication Middleware (JWT verification + Active account check)
   ├── Authorization Middleware (Role verification: STUDENT / ADMIN)
   ├── Validation Middleware (Zod runtime schemas)
   │
   ▼
Controllers (HTTP serialization & standardized status codes)
   │
   ▼
Domain Services (Business rules, validations, eligibility checks)
   │
   ▼
Repositories (Encapsulated data access logic)
   │
   ▼
Prisma ORM (Connection pooling & transactional operations)
   │
   ▼
PostgreSQL Database (Neon Cloud / Local Instance)
```

## Core Modules & Lifecycles

### 1. Authentication Lifecycle
- **Registration**: Restrictive public registration strictly defaults to `STUDENT` role. Passwords hashed using Argon2id with recommended OWASP memory and time costs.
- **Tokens**: 15-minute access token + 7-day refresh token.
- **Session Revocation**: Refresh tokens are tracked in the database by hash and token family (`familyId`). Any reuse of a revoked token automatically invalidates the entire session family.

### 2. Group Membership Lifecycle
- Single active group membership constraint enforced in service layer and database queries.
- Group creation atomically provisions the `OWNER` membership.
- Group capacity (configurable, default 5) verified inside database transactions during invitation acceptance.

### 3. Submission Confirmation Lifecycle
- Two-step confirmation process:
  1. Student selects "Yes, I have submitted".
  2. Dialog prompts for explicit final confirmation.
- Persisted in `SubmissionConfirmation` with unique constraint `(assignmentId, groupId)`.
- Records confirming student ID, UTC timestamp, and late status.
- Idempotent and thread-safe.

### 4. Progress & Analytics Engine
- **Targeting-Aware**: An assignment's denominator is strictly derived from its targeted audience:
  - `ALL_STUDENTS`: All active student groups.
  - `SELECTED_GROUP`: Only designated active groups.
- Denominator is NOT `totalGroups * totalAssignments`, preventing inflated or inaccurate metrics.
- Group completion percentage: `Math.round((submitted / totalApplicable) * 100)`.
