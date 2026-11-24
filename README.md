# Joineazy — Student, Group & Assignment Management System

**Sprint:** Sprint 1 — Foundation, Authentication, Groups and Assignments  
**Architecture:** Modular Monolith  
**Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + TanStack Query + React Hook Form + Zod + Lucide React  
**Backend:** Node.js + Express + TypeScript + Prisma + PostgreSQL + Zod + Argon2id + JWT  
**Containerization:** Docker + Docker Compose  

---

## 1. Project Overview

Joineazy enables students to collaborate in groups and complete assignments, while professors manage assignments, configure audience targeting, and share external OneDrive submission links.

### Sprint 1 Scope Deliverables

1. **Authentication & Authorization:**
   - Student public registration and secure login.
   - Professor / Admin provisioned authentication.
   - Argon2id password hashing.
   - JWT access token (15m) + rotating refresh token (7d) stored securely with token family reuse detection.
   - Role-based authorization middleware (`STUDENT`, `ADMIN`).

2. **Group Management:**
   - Students can form a group and automatically become the group `OWNER`.
   - Single active group constraint: a student cannot belong to more than one active group.
   - Group capacity enforcement (default 5 students).
   - Member removal restricted to group owner; owner cannot remove themselves leaving group ownerless.

3. **Group Invitations:**
   - Owner can invite registered students by email or student ID.
   - Prevent duplicate pending invitations, self-invitations, or invitations to students already in active groups.
   - Students can view received invitations and accept or reject.
   - Transactional acceptance with concurrent capacity validation.

4. **Assignment Management & Targeting:**
   - Admin creates and edits assignments (title, description, due date, OneDrive URL, status, target audience).
   - Targeting modes: `ALL_STUDENTS` or `SELECTED_GROUP` (multi-select).
   - Centralized visibility service: students only discover assignments targeted to all students or specifically to their active group.
   - External OneDrive links open safely with `target="_blank" rel="noopener noreferrer"`.

5. **User Interface:**
   - Light theme default, clean academic SaaS aesthetics, responsive down to 320px.
   - Strictly functional UI copy with zero marketing fluff.
   - Responsive button adaptation: icon-only with accessible `aria-label` on mobile viewports.

---

## 2. Default Seeded Credentials

The database comes pre-seeded with test accounts:

| Role | Email | Password | Details |
|---|---|---|---|
| **Admin (Professor)** | `professor@joineazy.edu` | `Password123!` | Can create and edit assignments |
| **Student 1** | `student1@joineazy.edu` | `Password123!` | Student ID: `STU-001` |
| **Student 2** | `student2@joineazy.edu` | `Password123!` | Student ID: `STU-002` |
| **Student 3** | `charlie@joineazy.edu` | `Password123!` | Student ID: `STU-003` |

---

## 3. Project Structure

```text
JoinEasy_assignment/
├── client/                     # Frontend application (React + Vite + Tailwind)
│   ├── src/
│   │   ├── app/                # Router and root providers
│   │   ├── components/         # Reusable UI (Button, Input, Card, Dialog, Badge, etc.)
│   │   ├── features/           # Auth, Groups, Invitations, Assignments, Dashboard
│   │   ├── lib/                # API client, TanStack query setup, utils
│   │   ├── styles/             # Tailwind index.css and design tokens
│   │   └── types/              # Domain TypeScript types
│   ├── Dockerfile
│   └── package.json
│
├── server/                     # Backend API (Express + Prisma + TypeScript)
│   ├── src/
│   │   ├── config/             # Environment validation and Prisma singleton
│   │   ├── middleware/         # Auth, validation, and error middlewares
│   │   ├── modules/            # Auth, Groups, Invitations, Assignments modules
│   │   ├── tests/              # Vitest integration test suite
│   │   ├── utils/              # JWT, Argon2id, API response/error helpers
│   │   ├── app.ts              # Express application assembly
│   │   └── server.ts           # Server bootstrap
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema and relations
│   │   └── seed.ts             # Provisioning script
│   ├── Dockerfile
│   └── package.json
│
├── docs/                       # Project documentation
│   ├── architecture.md
│   ├── api.md
│   ├── database.md
│   └── sprint-1-test-report.md
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 4. Getting Started & Local Setup

### Prerequisites
- Node.js (v20+ or v22+)
- npm or pnpm
- PostgreSQL connection (e.g. Neon or local Docker)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/wiz0007/JoinEasy-Task.git
   cd JoinEasy-Task
   ```

2. **Configure Environment Variables:**
   Copy `.env.example` to `server/.env` and configure your `DATABASE_URL`:
   ```bash
   cp .env.example server/.env
   ```

3. **Install Dependencies:**
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

4. **Synchronize Database & Seed Initial Users:**
   ```bash
   cd server
   npx prisma db push
   npm run prisma:seed
   ```

5. **Run the Applications:**
   - **Start Backend:**
     ```bash
     cd server
     npm run dev
     ```
     Server will listen on `http://localhost:5000/api/v1`.

   - **Start Frontend:**
     ```bash
     cd client
     npm run dev
     ```
     Client will launch on `http://localhost:5173`.

---

## 5. Running Automated Tests

Run the full integration test suite:
```bash
cd server
npm run test
```

All 20 test cases will execute against the configured test database.

---

## 6. Docker Deployment

To spin up all services via Docker Compose:
```bash
docker compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

---

## 7. Sprint 2 Extension Boundaries

The following features belong strictly to Sprint 2 and have clean relational extension paths ready:
- Two-step submission confirmation ("Yes, I have submitted").
- Submission audit timestamps and group progress calculations.
- Professor performance analytics dashboards and charts.
