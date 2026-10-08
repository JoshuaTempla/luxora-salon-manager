# Luxora: Salon Management System (Backend API)

REST API for running a small salon: employees, services, sales, payroll records, expenses, and business analytics.

Built for my family's salon business. It was self-hosted for private use and never publicly deployed. The seed data is fictional.

## Features

- JWT authentication with bcrypt password hashing
- Employee and service management, with per-employee and per-service stats
- Sales transactions with automatic commission calculation
- Payroll records with fixed per-employee deductions
- Fixed and variable expense tracking, including recurring expenses
- Analytics: dashboard, revenue trends, employee comparison, service performance, profit and loss, cash flow

## Tech Stack

Node.js, TypeScript, Express, Prisma, SQLite, JWT, bcrypt

## Getting Started

Requires Node.js 18+.

```bash
git clone https://github.com/JoshuaTempla/luxora-salon-manager.git
cd luxora-salon-manager
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run dev
```

The server runs on `http://localhost:3000`.

**Demo login (seed data):** `admin` / `admin123`. Change this in any real deployment.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | 3000 |
| `JWT_SECRET` | Secret for signing tokens | required |
| `DATABASE_URL` | SQLite connection | `file:./dev.db` |
| `CORS_ORIGIN` | Allowed origins | `*` |

## API Overview

All endpoints except login and register require `Authorization: Bearer <token>`.

| Resource | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/change-password` |
| Employees | `/api/employees` (CRUD), `GET /api/employees/:id/stats` |
| Services | `/api/services` (CRUD), `GET /api/services/:id/stats` |
| Transactions | `/api/transactions` (CRUD), `POST /bulk`, `GET /summary/stats` |
| Payroll | `/api/payroll` (CRUD), `POST /preview`, `GET /employee/:employeeId/summary` |
| Expenses | `/api/expenses` (CRUD), `POST /bulk`, `GET /summary/stats`, `GET /recurring/list` |
| Analytics | `/api/analytics/` `dashboard`, `revenue-trends`, `employee-comparison`, `service-performance`, `profit-loss`, `cash-flow` |

## Limitations

- **Single access level:** any authenticated user can reach every endpoint, including payroll and expenses. A `requireRole` middleware exists but is not applied to any route yet.
- **Open registration:** `POST /api/auth/register` is not restricted to administrators.
- **Payroll:** uses fixed per-employee deductions. It does not calculate statutory contributions or taxes, and it is not a compliance tool.
- **Database:** SQLite, single-instance deployment.
- **No automated tests.**
- **Not publicly deployed.** Originally self-hosted behind a VPN, which made access difficult for non-technical users.
