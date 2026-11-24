# Joineazy Sprint 1 — Test Execution Report

**Date:** 2026-11-24  
**Status:** ALL TESTS PASSING (20/20 Tests, 100% Pass Rate)

## Test Summary

| Test Suite | Total Tests | Passed | Failed | Duration |
|---|---|---|---|---|
| `auth.test.ts` | 8 | 8 | 0 | ~5.5s |
| `groups-and-assignments.test.ts` | 12 | 12 | 0 | ~20.6s |
| **Total** | **20** | **20** | **0** | **~26.1s** |

---

## Detailed Test Case Coverage

### 1. Authentication & Session Lifecycle (`auth.test.ts`)
- `[PASS]` 1. Register: should successfully register a new student with Argon2id password hash, access token and refresh token.
- `[PASS]` 2. Register: should reject duplicate email with 409 Conflict.
- `[PASS]` 3. Register: should reject password confirmation mismatch with 400 Bad Request.
- `[PASS]` 4. Login: should successfully authenticate seeded admin (`professor@joineazy.edu`).
- `[PASS]` 5. Login: should reject invalid password with 401 Unauthorized.
- `[PASS]` 6. Me: should access protected profile with valid JWT access token.
- `[PASS]` 7. Me: should reject unauthorized request without token.
- `[PASS]` 8. Refresh: should rotate refresh token, issue new access token, and reject token replay.

### 2. Group Management & Integrity (`groups-and-assignments.test.ts`)
- `[PASS]` 1. Student creates a new group and automatically becomes OWNER.
- `[PASS]` 2. Student cannot create a second group while already an active member (409 Conflict).
- `[PASS]` 3. Group Owner invites Student 2 by email.
- `[PASS]` 4. Group Owner cannot send duplicate pending invitation (409 Conflict).
- `[PASS]` 5. Invited Student 2 views received invitations and accepts atomically.
- `[PASS]` 6. Cannot accept already accepted invitation.

### 3. Assignment Management & Targeting (`groups-and-assignments.test.ts`)
- `[PASS]` 1. Admin creates an assignment targeting `ALL_STUDENTS`.
- `[PASS]` 2. Admin creates an assignment targeting `SELECTED_GROUP` only.
- `[PASS]` 3. Student cannot create an assignment (403 Forbidden).
- `[PASS]` 4. Student 1 (in targeted group) sees BOTH assignments.
- `[PASS]` 5. Student 3 (NOT in the targeted group) sees ONLY the `ALL_STUDENTS` assignment.
- `[PASS]` 6. Student 3 cannot access targeted assignment directly by ID (404 Concealed).

---

## Frontend Build & Static Analysis
- **TypeScript Strict Mode**: 0 errors (`tsc --noEmit` and `tsc -b` passed).
- **Vite Production Bundler**: Production assets built successfully in 9.51s.
- **Zero Mock Data**: Endpoints integrate directly with PostgreSQL via Prisma ORM.
