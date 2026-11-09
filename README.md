# Task Management System

A microservices-based task management system built with Node.js, Express, TypeScript, Prisma, and React.

## Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend  │────▶│   Auth Service  │────▶│  User Service   │
│  React/Vite │     │   (port 5003)   │     │  (port 5001)    │
│  (port 5173)│     └─────────────────┘     └─────────────────┘
│             │              │
│             │     ┌─────────────────┐
│             │────▶│  Task Service   │
│             │     │   (port 4005)   │
└─────────────┘     └─────────────────┘
```

Each service has its own PostgreSQL database:
- `user_db` — user accounts and roles
- `auth_db` — sessions and refresh token hashes
- `task_db` — tasks

## Services

### User Service (port 5001)
Manages user accounts, roles and status. Passwords are stored with bcrypt. The create and verify-credentials endpoints are internal-only, callable only by the Auth Service via a shared API key.

### Auth Service (port 5003)
Handles register, login, token refresh and logout. Login creates a session row in `auth_db` and issues:
- An **access token** (JWT, 15 min) returned in the response body
- A **refresh token** (JWT, 7 days) set as an `httpOnly` cookie — JavaScript cannot read it

Only the SHA-256 hash of the refresh token is stored in the database.

### Task Service (port 4005)
CRUD for tasks with role-based access control and a status workflow.

**Status flow:** `TODO → IN_PROGRESS → TO_BE_TESTED → TESTING_IN_PROGRESS → DONE`

**Permissions:**

| Action | Admin | Manager | Employee |
|---|---|---|---|
| View all tasks | ✅ | ✅ | ✅ |
| Create task | ✅ | ✅ | ❌ |
| Edit / delete | Any task | Own tasks only | ❌ |
| Change status | Any task | Own tasks only | Assigned tasks only |

### Frontend (port 5173)
React + Vite + Redux Toolkit. Access token is kept in Redux state (memory only). On page reload the app calls `/api/auth/refresh` — the browser sends the cookie automatically and the session is restored without requiring the user to log in again.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Three databases created: `user_db`, `auth_db`, `task_db`

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/Prakruthi276/Task-management-system-using-express.js.git
cd Task-management-system-using-express.js
```

### 2. Install dependencies

Run this in each service and the frontend:

```bash
cd services/user-service && npm install
cd ../auth-service && npm install
cd ../task-service && npm install
cd ../../frontend && npm install
```

### 3. Create `.env` files

Each service needs a `.env` file. The values marked `SAME_VALUE` must match across all services.

**`services/user-service/.env`**
```env
PORT=5001
NODE_ENV=development
DATABASE_URL="postgresql://postgres:<password>@localhost:5432/user_db?schema=public"
JWT_ACCESS_SECRET=SAME_VALUE          # must match auth-service and task-service
INTERNAL_API_KEY=SAME_VALUE           # must match auth-service and task-service
ADMIN_NAME=System Admin
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=ChangeMe123            # remove after running seed:admin
```

**`services/auth-service/.env`**
```env
PORT=5003
NODE_ENV=development
DATABASE_URL="postgresql://postgres:<password>@localhost:5432/auth_db?schema=public"
USER_SERVICE_URL=http://localhost:5001
JWT_ACCESS_SECRET=SAME_VALUE
JWT_ACCESS_TTL_SECONDS=900
JWT_REFRESH_SECRET=<a different secret>
JWT_REFRESH_TTL_SECONDS=604800
CORS_ORIGIN=http://localhost:5173
INTERNAL_API_KEY=SAME_VALUE
```

**`services/task-service/.env`**
```env
PORT=4005
NODE_ENV=development
DATABASE_URL="postgresql://postgres:<password>@localhost:5432/task_db?schema=public"
JWT_ACCESS_SECRET=SAME_VALUE
USER_SERVICE_URL=http://localhost:5001
INTERNAL_API_KEY=SAME_VALUE
```

**`frontend/.env`**
```env
VITE_AUTH_URL=http://localhost:5003
```

### 4. Run database migrations

```bash
cd services/user-service  && npx prisma migrate deploy
cd ../auth-service         && npx prisma migrate deploy
cd ../task-service         && npx prisma migrate deploy
```

### 5. Seed the first admin

```bash
cd services/user-service
npm run seed:admin
```

This creates `admin@company.com` (or whatever you set in `.env`). After it prints `Admin created`, remove `ADMIN_PASSWORD` from `.env`.

### 6. Start the services

Open four terminals:

```bash
# Terminal 1
cd services/user-service && npm run dev

# Terminal 2
cd services/auth-service && npm run dev

# Terminal 3
cd services/task-service && npm run dev

# Terminal 4
cd frontend && npm run dev
```

## API Documentation

Each service exposes a Swagger UI:

| Service | URL |
|---|---|
| User Service | http://localhost:5001/api-docs |
| Auth Service | http://localhost:5003/api-docs |
| Task Service | http://localhost:4005/api-docs |

## API Overview

### Auth Service

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an EMPLOYEE account |
| POST | `/api/auth/login` | Log in, get access token + cookie |
| POST | `/api/auth/refresh` | Rotate tokens using the cookie |
| POST | `/api/auth/logout` | Revoke session, clear cookie |

### User Service

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users/directory` | Any logged-in user | Names only, for assignee lists |
| GET | `/api/users` | Admin | Full user list with filters |
| GET | `/api/users/:id` | Admin, self, or internal key | Get a user |
| PUT | `/api/users/:id` | Admin | Update name or role |
| PATCH | `/api/users/:id/status` | Admin | Activate or deactivate |

### Task Service

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/tasks` | Any logged-in user | List tasks (filterable) |
| GET | `/api/tasks/:id` | Any logged-in user | Get a task |
| POST | `/api/tasks` | Admin, Manager | Create a task |
| PUT | `/api/tasks/:id` | Admin, Manager (own) | Update a task |
| PATCH | `/api/tasks/:id/status` | All roles (ownership rules apply) | Change status |
| DELETE | `/api/tasks/:id` | Admin, Manager (own) | Delete a task |

## Security

- Passwords hashed with **bcrypt** (10 rounds)
- Refresh tokens stored as **SHA-256 hashes** — raw tokens never touch the database
- Refresh token in an **httpOnly cookie** — not readable by JavaScript
- Access token in **memory only** — not stored in localStorage or cookies
- **Token rotation** on every refresh — reuse of an old token revokes the session
- **Algorithm pinned to HS256** — prevents algorithm-substitution attacks
- Internal service calls protected by a **shared API key** with constant-time comparison
- **Last-admin guard** — the system refuses to remove the only active admin
- Role comes from the **signed token**, never from the request body

## Project Structure

```
task-management-system/
├── frontend/                   # React + Vite + Redux Toolkit
├── services/
│   ├── auth-service/           # Sessions, JWT, cookies
│   │   ├── prisma/             # Session model
│   │   └── src/
│   │       ├── clients/        # HTTP client for user-service
│   │       ├── config/         # env, prisma, swagger
│   │       ├── controllers/
│   │       ├── middleware/
│   │       ├── routes/
│   │       ├── services/
│   │       ├── types/
│   │       ├── utils/          # AppError, tokens, cookies
│   │       └── validators/
│   ├── task-service/           # Task CRUD + RBAC
│   │   ├── prisma/             # Task model
│   │   └── src/
│   │       ├── clients/        # HTTP client for user-service
│   │       ├── config/
│   │       ├── controllers/
│   │       ├── middleware/     # auth + validate
│   │       ├── routes/
│   │       ├── services/
│   │       ├── types/
│   │       └── validators/
│   └── user-service/           # User accounts + roles
│       ├── prisma/             # User model
│       └── src/
│           ├── config/
│           ├── controllers/
│           ├── middleware/     # auth + internalKey + access
│           ├── routes/
│           ├── scripts/        # seedAdmin.ts
│           ├── services/
│           ├── types/
│           └── validators/
```

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Runtime | Node.js |
| Framework | Express 5 |
| ORM | Prisma |
| Database | PostgreSQL |
| Validation | Zod |
| Auth | JSON Web Tokens (jsonwebtoken) |
| Password hashing | bcryptjs |
| HTTP client | axios / fetch |
| API docs | Swagger UI (swagger-ui-express) |
| Frontend | React 18, Vite, Redux Toolkit |
