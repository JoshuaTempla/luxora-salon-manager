# Salon Management System - Backend API

A comprehensive REST API for managing salon operations including employees, services, transactions, payroll, expenses, and business analytics.

## Features

- **Authentication & Authorization** - JWT-based auth with role-based access
- **Employee Management** - Full CRUD with performance tracking
- **Service Management** - Service catalog with pricing and commissions
- **Transaction Recording** - Sales tracking with automatic commission calculation
- **Payroll Management** - Employee payroll cycles with auto-calculations
- **Expense Tracking** - Fixed and variable expense management
- **Analytics & Reporting** - Comprehensive business insights and KPIs

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT + bcrypt
- **API Design**: RESTful

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd salon-management-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update the values (especially JWT_SECRET for production):
   ```env
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   DATABASE_URL="file:./dev.db"
   ```

4. **Initialize the database**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate
   
   # Run database migrations
   npm run prisma:migrate
   
   # Seed the database with sample data
   npm run db:seed
   ```

5. **Start the server**
   ```bash
   # Development mode (with hot reload)
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/change-password` - Change password (protected)

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete/deactivate employee
- `GET /api/employees/:id/stats` - Get employee statistics

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get service by ID
- `POST /api/services` - Create service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete/deactivate service
- `GET /api/services/:id/stats` - Get service statistics

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/summary/stats` - Get transaction summary
- `POST /api/transactions/bulk` - Bulk create transactions

### Payroll
- `GET /api/payroll` - Get all payrolls
- `GET /api/payroll/:id` - Get payroll by ID
- `POST /api/payroll` - Create payroll
- `POST /api/payroll/preview` - Preview payroll calculation
- `PUT /api/payroll/:id` - Update payroll
- `DELETE /api/payroll/:id` - Delete payroll
- `GET /api/payroll/employee/:employeeId/summary` - Get employee payroll summary

### Expenses
- `GET /api/expenses` - Get all expenses
- `GET /api/expenses/:id` - Get expense by ID
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/summary/stats` - Get expense statistics
- `POST /api/expenses/bulk` - Bulk create expenses
- `GET /api/expenses/recurring/list` - Get recurring expenses

### Analytics
- `GET /api/analytics/dashboard` - Overall business dashboard
- `GET /api/analytics/revenue-trends` - Revenue trends over time
- `GET /api/analytics/employee-comparison` - Employee performance comparison
- `GET /api/analytics/service-performance` - Service performance analysis
- `GET /api/analytics/profit-loss` - Profit & Loss statement
- `GET /api/analytics/cash-flow` - Cash flow analysis
- `GET /api/analytics/kpis` - Key performance indicators

## API Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

Example using curl:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:3000/api/employees
```

## Database Management

```bash
# Open Prisma Studio (database GUI)
npm run prisma:studio

# Create a new migration
npm run prisma:migrate

# Reset database and reseed
npm run db:reset
```

## Project Structure

```
src/
├── index.ts              # Main server file
├── lib/
│   ├── db.ts            # Database connection
│   └── auth.ts          # Authentication utilities
├── middleware/
│   └── auth.ts          # Auth middleware
├── routes/
│   ├── auth.ts          # Auth routes
│   ├── employees.ts     # Employee routes
│   ├── services.ts      # Service routes
│   ├── transactions.ts  # Transaction routes
│   ├── payroll.ts       # Payroll routes
│   ├── expenses.ts      # Expense routes
│   └── analytics.ts     # Analytics routes
├── types/
│   └── index.ts         # TypeScript types
└── scripts/
    └── seed.ts          # Database seeding script

prisma/
└── schema.prisma        # Database schema
```

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Sample API Calls

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Create Transaction
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "emp-1",
    "serviceId": "service-id",
    "soldPrice": 300
  }'
```

### Get Dashboard Analytics
```bash
curl http://localhost:3000/api/analytics/dashboard?startDate=2024-01-01&endDate=2024-12-31 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment | development |
| JWT_SECRET | JWT signing secret | (required) |
| DATABASE_URL | Database connection | file:./dev.db |
| CORS_ORIGIN | CORS allowed origins | * |

## License

ISC

## Support

For issues and questions, please create an issue in the repository.