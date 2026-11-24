# Joineazy Testing Architecture & Guide

This document describes the automated testing strategy, execution setup, and coverage for the Joineazy full-stack application.

## 1. Testing Stack

- **Framework**: Vitest v3
- **HTTP / API Integration**: Supertest v7
- **Database**: PostgreSQL (Neon Cloud / Local) via Prisma Client
- **Type Checking**: Strict TypeScript (`tsc --noEmit`)
- **Frontend Bundling / Build**: Vite Production Bundler (`tsc -b && vite build`)

---

## 2. Test Suites

All tests are located under `server/src/tests/`:

1. `auth.test.ts` (8 Tests):
   - Student registration with Argon2id password hashing and JWT issuance.
   - Duplicate email rejection (409 Conflict).
   - Password confirmation mismatch rejection (400 Bad Request).
   - Admin authentication (`professor@joineazy.edu`).
   - Invalid password rejection (401 Unauthorized).
   - Protected endpoint access via Bearer access token.
   - Unauthenticated rejection.
   - Refresh token rotation, new token issuance, and replay attack prevention.

2. `groups-and-assignments.test.ts` (12 Tests):
   - Student group creation with automatic `OWNER` role assignment.
   - Single active group constraint enforcement (409 Conflict).
   - Member invitation by email / student ID.
   - Duplicate invitation prevention (409 Conflict).
   - Student invitation acceptance and atomic group membership enrollment.
   - Prevention of accepting already-accepted invitations.
   - Admin assignment creation with `ALL_STUDENTS` targeting.
   - Admin assignment creation with `SELECTED_GROUP` targeting.
   - Student assignment creation blocking (403 Forbidden).
   - Targeted group assignment visibility.
   - Untargeted group assignment concealment.
   - Concealing private assignment details from unauthorized student IDs (404 NotFound).

3. `submissions-and-analytics.test.ts` (11 Tests):
   - Two-step submission confirmation by active group member.
   - Duplicate submission confirmation prevention (409 Conflict).
   - Unrelated student submission confirmation rejection (403 Forbidden).
   - Group submission retrieval and verifying confirming student name.
   - Group progress calculation (`total`, `submitted`, `pending`, `overdue`, `progressPercentage`).
   - Unauthorized group progress access rejection (403 Forbidden).
   - Admin global analytics dashboard summary.
   - Assignment-wise analytics calculation.
   - Group-wise performance analytics calculation.
   - Student-wise confirmation audit trail (confirming student, timestamp, late status).
   - Student blocked from admin analytics endpoints (403 Forbidden).

---

## 3. Running Tests

To run the automated test suite:
```bash
cd server
npm run test
```

To run with coverage:
```bash
cd server
npm run test -- --coverage
```
