# Joineazy System Architecture — Sprint 1

## Overview

Joineazy is designed as a modular monolith with strict separation of concerns across the presentation, application, domain, and data persistence layers.

```
Client (React 18 + Vite + Tailwind + TanStack Query)
   │
   ▼ HTTPS / JSON REST API
Route Handler (Express)
   │
   ▼
Authentication & Authorization Middleware (JWT + Argon2id)
   │
   ▼
Validation Middleware (Zod Schemas)
   │
   ▼
Controller Layer (HTTP Serialization & Status Codes)
   │
   ▼
Service Layer (Business Rules & Transaction Orchestration)
   │
   ▼
Repository Layer (Data Access & Query Logic)
   │
   ▼
Prisma ORM (Parameterized Queries & Connection Pooling)
   │
   ▼
PostgreSQL Database (Neon Cloud / Local)
```

## Architectural Principles

1. **Unidirectional Execution Flow**: Requests pass strictly through:
   `Route → Auth Middleware → Validation Middleware → Controller → Service → Repository → Prisma → PostgreSQL`.
2. **Business Rule Isolation**: Route handlers and controllers only handle request mapping and HTTP semantics; services hold all domain rules.
3. **Relational Integrity**: Group memberships, single-group constraints, and audience targeting rules are enforced via database transactions and foreign key relationships.
4. **Token Security & Rotation**:
   - Access tokens are short-lived (15 minutes).
   - Refresh tokens are rotated on each use.
   - Refresh tokens are stored as SHA-256 hashes in the database with family tracking (`familyId`) for instant token reuse detection and session invalidation.
5. **No AI Promotional Copy**: The user interface strictly follows a functional SaaS design language with clear academic status indicators and zero marketing fluff.
