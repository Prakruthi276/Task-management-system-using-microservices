# Task Manager frontend, stage 1: authentication

React + TypeScript + Redux Toolkit + React Router + Axios, connected to the Auth service.

Stages:

1. Authentication (this stage): register, login, logout, session restore, route guards
2. Tasks
3. Users (admin)
4. Audit

## Run

```bash
npm install
cp .env.example .env     # on Windows PowerShell: Copy-Item .env.example .env
npm run dev              # http://localhost:5173
```

Start the User service (5001) and the Auth service (4000) first.

The Auth service must allow this origin and send cookies. In the Auth service `.env`:

```
CORS_ORIGIN=http://localhost:5173
```

and in `src/utils/cookies.ts` the cookie should use `sameSite: "strict"`.

## Scripts

| Command | What it does |
|---|---|
| npm run dev | Start the dev server |
| npm run typecheck | Check the TypeScript types |
| npm run build | Type-check and build for production |

## Structure

```
src/
  app/        store, typed hooks, typed thunk helper
  api/        Axios client for the Auth service, single-flight refresh
  features/
    auth/     login, register, session slice, session panel
  components/ layout, route guards, shared UI
  pages/      home and 404
  types/      shared TypeScript types
  utils/      error parsing, JWT decoding (display only)
```
