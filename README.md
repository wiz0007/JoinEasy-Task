# Joineazy — Student, Group & Assignment Management System

**Project:** Full-Stack Assignment Management Platform  
**Architecture:** Modular Monolith  
**Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + TanStack Query + React Hook Form + Zod + Lucide React  
**Backend:** Node.js + Express + TypeScript + Prisma + PostgreSQL + Zod + Argon2id + JWT  
**Containerization:** Docker + Docker Compose  
**Repository:** [JoinEasy-Task](https://github.com/wiz0007/JoinEasy-Task.git)  

---

## 1. Project Overview

Joineazy is a full-stack academic platform where students form collaborative groups, manage group members, receive assignments, access OneDrive submission repositories, confirm submissions via a two-step verification workflow, and monitor group progress. Professors (Admins) manage assignments, configure audience targeting (all students or selected groups), and analyze group-wise and student-wise submission performance through an analytics dashboard.

---

## 2. Seeded Test Credentials

The database is pre-seeded with test accounts:

| Role | Email | Password | Identifier | Permissions |
|---|---|---|---|---|
| **Admin (Professor)** | `professor@joineazy.edu` | `Password123!` | — | Create/edit assignments, target groups, view analytics |
| **Student 1** | `student1@joineazy.edu` | `Password123!` | `STU-001` | Create group, invite members, submit confirmations |
| **Student 2** | `student2@joineazy.edu` | `Password123!` | `STU-002` | Receive invitations, join groups, submit confirmations |
| **Student 3** | `charlie@joineazy.edu` | `Password123!` | `STU-003` | Standalone student |

---

## 3. Project Structure

```text
JoinEasy_assignment/
├── client/                     # Frontend Application
│   ├── src/
│   │   ├── app/                # Router and React Query providers
│   │   ├── components/         # Reusable UI (Button, Input, Card, Dialog, Badge, ProgressBar)
│   │   ├── features/
│   │   │   ├── auth/           # Login, Register, AuthContext
│   │   │   ├── groups/         # GroupsPage, CreateGroupModal, AdminGroupsListPage
│   │   │   ├── invitations/    # InvitationsPage, InviteMemberModal
│   │   │   ├── assignments/    # AssignmentsListPage, AssignmentDetailsPage, Modals
│   │   │   ├── submissions/    # ConfirmSubmissionDialog (Two-step confirmation)
│   │   │   └── dashboard/      # StudentDashboard, AdminDashboard (Analytics)
│   │   ├── lib/                # API client with token refresh, utils
│   │   ├── styles/             # Tailwind CSS tokens
│   │   └── types/              # TypeScript domain types
│   ├── Dockerfile
│   └── package.json
│
├── server/                     # Backend API
│   ├── src/
│   │   ├── config/             # Zod environment config and Prisma client
│   │   ├── middleware/         # Auth, validation, and error middlewares
│   │   ├── modules/
│   │   │   ├── auth/           # Registration, login, logout, refresh, me
│   │   │   ├── groups/         # Group management and membership
│   │   │   ├── invitations/    # Student invitations and acceptance
│   │   │   ├── assignments/    # Assignment CRUD and targeting
│   │   │   ├── submissions/    # Two-step confirmation and group progress
│   │   │   └── analytics/      # Professor dashboard and reporting
│   │   ├── tests/              # 31 Automated Integration Tests
│   │   ├── utils/              # Argon2id, JWT, API response/error classes
│   │   ├── app.ts              # Express application assembly
│   │   └── server.ts           # Server bootstrap
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema and relations
│   │   └── seed.ts             # Provisioning script
│   ├── Dockerfile
│   └── package.json
│
├── docs/                       # Project Documentation
│   ├── architecture.md         # System architecture and request flow
│   ├── api.md                  # REST endpoint definitions
│   ├── database.md             # Entity Relationship Diagram & constraints
│   ├── testing.md              # Testing guide and coverage
│   ├── sprint-1-test-report.md # Sprint 1 test report
│   └── sprint-2-test-report.md # Sprint 2 test report (31/31 passed)
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 4. Local Installation & Development

### 1. Configure Environment Variables
Copy `.env.example` to `server/.env` and update the connection string:
```bash
cp .env.example server/.env
```

### 2. Install Dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 3. Synchronize Database & Seed
```bash
cd server
npx prisma db push
npm run prisma:seed
```

### 4. Run Locally
- **Start Backend:**
  ```bash
  cd server
  npm run dev
  ```
  API runs on `http://localhost:5000/api/v1`

- **Start Frontend:**
  ```bash
  cd client
  npm run dev
  ```
  Web client runs on `http://localhost:5173`

---

## 5. Automated Tests

Run the full integration test suite (31 tests across auth, groups, assignments, submissions, and analytics):
```bash
cd server
npm run test
```

All 31 integration tests run deterministically against the database with 100% pass rate.

---

## 6. Docker Deployment

To build and run all services in Docker:
```bash
docker compose up --build
```
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
