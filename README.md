# Tania Dashboard — Frontend

Frontend for the **Tania Talent Profile** feature: complete profiles (identity,
role, grade, squad, location, status, manager) shown and searchable, with
profiles auto-created when a user is made.

This repo contains **frontend only**. It does not ship a database or API
implementation — it reads and writes talent data through an **external API**
whose base URL is configured via environment variables (backend, e.g. SQLite,
is developed separately).

## Stack

- [Next.js](https://nextjs.org) (App Router, server components)
- TypeScript
- Tailwind CSS
- Vitest (unit tests)

## Getting started

Requirements: Node.js >= 20 (tested with 24).

```bash
npm install
cp .env.example .env.local   # then point the URLs at your API
npm run dev
```

Open http://localhost:3000 — `/` redirects to `/talents`.

### Environment variables

| Variable                    | Used by                                  | Description                                       |
| --------------------------- | ---------------------------------------- | ------------------------------------------------- |
| `TANIA_API_URL`             | Server-rendered pages                    | Base URL of the external Talent Profile API       |
| `NEXT_PUBLIC_TANIA_API_URL` | Client-side "Add User" form              | Same API, accessible from the browser (CORS)      |

Example:

```bash
TANIA_API_URL=http://localhost:8080
NEXT_PUBLIC_TANIA_API_URL=http://localhost:8080
```

## API contract

The frontend expects the backend to expose:

| Method | Path             | Description                                      |
| ------ | ---------------- | ------------------------------------------------ |
| GET    | `/profiles?q=`   | List/search profiles → `{ query, count, profiles }` |
| GET    | `/profiles/:id`  | Profile detail → `{ profile }` or `404`            |
| POST   | `/users`         | Create a user + auto-profile → `{ profile }` (201) |

`ProfileView` shape (camelCase):

```ts
{
  userId: number;
  name: string;
  email: string;
  employeeId: string;
  role: string;
  grade: string;
  squad: string;
  location: string;
  status: string;
  managerId: number | null;
  managerName: string | null;
  createdAt: string;
}
```

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm start          # serve production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # vitest run
```