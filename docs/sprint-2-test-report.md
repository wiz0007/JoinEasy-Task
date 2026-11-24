# Joineazy Sprint 2 — Test Execution Report

**Date:** 2026-11-24  
**Sprint:** Sprint 2 — Submissions, Progress Tracking, Analytics, and Final Delivery  
**Status:** ALL TESTS PASSING (31/31 Tests, 100% Pass Rate)

---

## 1. Executive Summary

| Test File | Total Tests | Passed | Failed | Skipped | Duration |
|---|---|---|---|---|---|
| `auth.test.ts` | 8 | 8 | 0 | 0 | ~5.3s |
| `groups-and-assignments.test.ts` | 12 | 12 | 0 | 0 | ~19.8s |
| `submissions-and-analytics.test.ts` | 11 | 11 | 0 | 0 | ~24.2s |
| **Total** | **31** | **31** | **0** | **0** | **~49.3s** |

---

## 2. Test Execution Details

### A. Authentication Module (`auth.test.ts`)
- `[PASS]` 1. Register: should successfully register a new student
- `[PASS]` 2. Register: should reject duplicate email (409 Conflict)
- `[PASS]` 3. Register: should reject password confirmation mismatch (400 Bad Request)
- `[PASS]` 4. Login: should successfully authenticate seeded admin
- `[PASS]` 5. Login: should reject invalid password (401 Unauthorized)
- `[PASS]` 6. Me: should access protected profile with valid access token
- `[PASS]` 7. Me: should reject unauthorized request without token
- `[PASS]` 8. Refresh: should rotate refresh token and issue new access token

### B. Groups & Assignments Workflows (`groups-and-assignments.test.ts`)
- `[PASS]` 1. Student creates a new group and automatically becomes OWNER
- `[PASS]` 2. Student cannot create a second group while already an active member
- `[PASS]` 3. Group Owner invites Student 2 by email
- `[PASS]` 4. Group Owner cannot send duplicate pending invitation
- `[PASS]` 5. Invited Student 2 views received invitations and accepts
- `[PASS]` 6. Cannot accept already accepted invitation
- `[PASS]` 7. Admin creates an assignment targeting ALL_STUDENTS
- `[PASS]` 8. Admin creates an assignment targeting SELECTED_GROUP only
- `[PASS]` 9. Student cannot create an assignment (Forbidden)
- `[PASS]` 10. Student 1 (in targeted group) sees BOTH assignments
- `[PASS]` 11. Student 3 (NOT in the targeted group) sees ONLY the ALL_STUDENTS assignment
- `[PASS]` 12. Student 3 cannot access targeted assignment directly by ID

### C. Submissions & Analytics Workflows (`submissions-and-analytics.test.ts`)
- `[PASS]` 1. Should confirm submission by active group member
- `[PASS]` 2. Should prevent duplicate submission confirmation by another group member (409 Conflict)
- `[PASS]` 3. Should reject confirmation by student not in the group (403 Forbidden)
- `[PASS]` 4. Should retrieve confirmed submission details for group member
- `[PASS]` 5. Should accurately calculate group progress (total, submitted, pending, overdue, percentage)
- `[PASS]` 6. Should reject unauthorized student from viewing another group progress (403 Forbidden)
- `[PASS]` 7. Should return global dashboard summary for Admin
- `[PASS]` 8. Should return assignment-wise analytics for Admin
- `[PASS]` 9. Should return group-wise performance analytics for Admin
- `[PASS]` 10. Should return student-wise confirmation audit trail for Admin
- `[PASS]` 11. Should block students from accessing admin analytics endpoints (403 Forbidden)

---

## 3. Static Analysis & Build Verification
- **Server TypeScript Strict Check**: 0 errors (`tsc --noEmit` passed).
- **Client TypeScript Strict Check**: 0 errors (`tsc -b` passed).
- **Client Production Bundle**: Built cleanly in 11.66s.
- **Repository Secrets Audit**: Verified `.env` is ignored by `.gitignore`.
