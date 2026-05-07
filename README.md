# FinTrack — Personal Finance Management System

A full-stack personal finance web application built with **React + Tailwind CSS** (frontend) and **Python FastAPI** (backend), backed by a **MySQL** database.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Design](#database-design)
- [API Overview](#api-overview)
- [Security](#security)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Database Setup](#1-database-setup)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
  - [4. Accessing from Other Devices on the Same Network](#4-accessing-from-other-devices-on-the-same-network)
- [Demo Accounts](#demo-accounts)
- [Environment Variables](#environment-variables)

---

## Features

| Module | Description |
|---|---|
| **Dashboard** | KPI cards (balance, income, expenses, savings), interactive bar chart (monthly/yearly/daily), expense breakdown pie chart, CSV export |
| **Accounts** | Manage bank accounts, e-wallets, credit cards, cash; automatic balance updates via DB triggers |
| **Transactions** | Add/delete income & expenses, search & filter, real-time balance validation |
| **Budget** | Set per-category monthly limits, visual progress bars with over-budget alerts |
| **Goals** | Savings goals with target amount, progress tracking, deposit functionality |
| **Analytics** | Multi-month income/expense trends, category breakdown |
| **Settings** | Update profile, change phone number, delete account |
| **Auth** | JWT-based register/login with bcrypt password hashing |

---

## Tech Stack

### Frontend
- **React 18** with React Router v6
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Axios** for API communication
- **Vite** as build tool

### Backend
- **Python 3.11+**
- **FastAPI** — REST API framework
- **Uvicorn** — ASGI server
- **mysql-connector-python** — MySQL driver with connection pooling
- **PyJWT + bcrypt** — Authentication
- **Pydantic** — Request validation
- **SlowAPI** — Rate limiting middleware

### Database
- **MySQL 8.0+**
- Views, Stored Procedures, Triggers, and User-Defined Functions

---

## Project Structure

```
fintrack/
│
├── backend/                        # FastAPI backend
│   ├── main.py                     # App entry point, CORS, route registration
│   ├── db.py                       # MySQL connection pool & DBContext manager
│   ├── limiter.py                  # SlowAPI rate limiter instance
│   ├── requirements.txt            # Python dependencies
│   ├── .env                        # Environment variables (create from .env.example)
│   │
│   ├── middleware/
│   │   └── auth.py                 # JWT Bearer token verification
│   │
│   └── routes/
│       ├── auth.py                 # POST /api/auth/register, /api/auth/login
│       ├── accounts.py             # CRUD /api/accounts
│       ├── transactions.py         # CRUD /api/transactions
│       ├── budgets.py              # CRUD /api/budgets
│       ├── goals.py                # CRUD /api/goals
│       ├── analytics.py            # GET  /api/analytics/trend, /categories
│       ├── overview.py             # GET  /api/overview/summary, /monthly, /yearly, /daily
│       └── settings.py             # GET/PATCH /api/settings/profile, DELETE /api/settings/account
│
├── frontend/                       # React + Vite + Tailwind CSS
│   ├── public/                     # Static assets
│   │   └── icons/  
|   |       └── goals/                
│   │
│   ├── src/
│   │   ├── main.jsx                # React entry point (bootstrap to DOM)
│   │   ├── index.css               # Global Tailwind directives (@tailwind base/components/utilities)
│   │   ├── App.jsx                 # Router setup, protected routes
│   │   ├── api/
│   │   │   └── client.js           # Axios instance with JWT interceptor
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Auth state (login/logout/register)
│   │   ├── utils/
│   │   │   └── format.js           # VND formatter, date helpers (fmtVND, fmtDate, daysLeft)
│   │   ├── components/
│   │   │   └── ui.jsx              # Reusable UI primitives (StatCard, Card, Modal, Button, etc.)
│   │   └── pages/
│   │       ├── AuthPage.jsx        # Login & Register (public route)
│   │       ├── DashboardLayout.jsx # Sidebar + layout wrapper (protected)
│   │       ├── Overview.jsx        # Dashboard with KPI cards & charts
│   │       ├── Accounts.jsx        # Account management (create/delete)
│   │       ├── Transactions.jsx    # Transaction list (add/search/delete)
│   │       ├── Budget.jsx          # Budget tracking & alerts
│   │       ├── Goals.jsx           # Savings goals (create/deposit/delete)
│   │       ├── Analytics.jsx       # Advanced analytics & trends
│   │       └── Settings.jsx        # User profile & account deletion
│   │
│   ├── index.html                  # HTML entry point
│   ├── vite.config.js              # Vite build config (port 5173, React plugin)
│   ├── tailwind.config.js          # Tailwind CSS configuration
│   ├── postcss.config.js           # PostCSS config (Tailwind + autoprefixer)
│   ├── eslintrc.js                 # ESLint code style rules
│   ├── package.json                # Dependencies + npm scripts
│   ├── node_modules/               # Installed packages (generated)
│   └── .env                        # Environment variables (VITE_API_URL)
│
└── database/
    ├── schema.sql                  # Full DB schema (tables, views, triggers, functions, procedures)
    └── sample_data.sql             # Demo data for 2 test users
```

---

## Database Design

### Tables
| Table | Description |
|---|---|
| `Users` | User accounts with bcrypt-hashed passwords |
| `BankAccounts` | Financial accounts per user (bank, cash, e-wallet, etc.) |
| `Income` | Income transactions |
| `Expenses` | Expense transactions linked to categories |
| `ExpenseCategories` | Master list of spending categories |
| `Budgets` | Per-user, per-category monthly spending limits |
| `Goals` | Savings goals with target and saved amounts |

### Key Database Objects
- **Triggers** — Auto-update `BankAccounts.Balance` on insert/delete of Income or Expenses
- **Stored Procedures** — `sp_AddIncome`, `sp_AddExpense`, `sp_DeleteIncome`, `sp_DeleteExpense`, `sp_DeleteUser`
- **Functions** — `GetTotalIncome`, `GetTotalExpense`, `GetBudgetStatus`, `fn_WouldGoNegative`, `fn_GetAccountBalance`
- **Views** — `MonthlyIncomeSummary`, `MonthlyExpenseSummary`, `CategorySpendingSummary`, `MonthlyCategoryExpense`, `MonthlyIncomeByAccount`, `MonthlyExpenseByAccount`

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login, receive JWT |
| GET | `/api/accounts` | List all accounts |
| POST | `/api/accounts` | Create account |
| DELETE | `/api/accounts/{id}` | Delete account |
| GET | `/api/transactions` | List transactions (with search/filter) |
| POST | `/api/transactions` | Add transaction |
| DELETE | `/api/transactions/{id}` | Delete transaction |
| GET | `/api/budgets` | Get budgets + spending summary |
| PUT | `/api/budgets` | Batch save budgets |
| GET | `/api/goals` | List goals |
| POST | `/api/goals` | Create goal |
| PATCH | `/api/goals/{id}/deposit` | Deposit into goal |
| DELETE | `/api/goals/{id}` | Delete goal |
| GET | `/api/overview/summary` | KPI summary cards |
| GET | `/api/overview/monthly` | Monthly chart data |
| GET | `/api/analytics/trend` | Income/expense trend |

> All endpoints except `/api/auth/*` require `Authorization: Bearer <token>` header.

---

## Security

### Authentication & Authorization
- **JWT (JSON Web Token)** — issued on login, expires in 7 days (configurable via `JWT_EXPIRES_IN` in `.env`). All protected routes verify the token via the `verify_token` dependency in `middleware/auth.py`.
- **bcrypt password hashing** — passwords are hashed with cost factor 12 before storage. Plain-text passwords are never stored or logged.
- **Token stored client-side** — the frontend stores the JWT in `localStorage` and attaches it to every API request via an Axios interceptor. On a 401 response, the token is cleared and the user is redirected to `/login`.

### Rate Limiting
- **SlowAPI** middleware is applied to the login endpoint: **5 requests per minute per IP** (`@limiter.limit("5/minute")`). This protects against brute-force password attacks.
- The limiter instance is defined in `limiter.py` and registered in `main.py`. Rate-limit errors return HTTP 429.

### Input Validation
- All request bodies are validated by **Pydantic** models, preventing malformed or unexpected data from reaching the database layer.
- SQL queries use **parameterized statements** (`%s` placeholders) throughout `DBContext`, eliminating SQL injection risk.

### Business Logic Guards
- **`fn_WouldGoNegative`** (MySQL UDF) — called inside `sp_AddExpense` to reject any expense that would overdraw an account.
- Account ownership is verified on every account/transaction operation — users can only access their own data.
- **Cascade deletes** — `ON DELETE CASCADE` on foreign keys ensures all user data is cleaned up when an account is deleted via `sp_DeleteUser`.

### CORS
- The backend allows requests only from explicitly whitelisted origins (localhost and the configured `LOCAL_IP`). See `main.py` for the `origins` list.

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **Python** 3.11+
- **MySQL** 8.0+

---

### 1. Database Setup

```bash
# Import the schema (creates database + all objects)
mysql -u root -p < database/schema.sql

# (Optional) Load demo data
mysql -u root -p PersonalFinance < database/sample_data.sql
```

Create a MySQL user for the app:

```sql
CREATE USER 'finance_app'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON PersonalFinance.* TO 'finance_app'@'localhost';
FLUSH PRIVILEGES;
```

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
DB_HOST=localhost
DB_PORT=3306
DB_USER=finance_app
DB_PASS=your_db_password
DB_NAME=PersonalFinance
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
LOCAL_IP=192.168.x.x
EOF

# Start the server (localhost only)
uvicorn main:app --reload --port 3001

# Start the server (accessible on local network)
uvicorn main:app --reload --host 0.0.0.0 --port 3001
```

The API will be available at `http://localhost:3001`.  
Interactive API docs: `http://localhost:3001/docs`

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
VITE_API_URL=http://localhost:3001/api
EOF

# Start development server (localhost only)
npm run dev

# Start development server (accessible on local network)
npm run dev -- --host
```

The app will be available at:
- **Local:** `http://localhost:5173`
- **Network:** `http://<your-local-ip>:5173` (when started with `--host`)

---

### 4. Accessing from Other Devices on the Same Network

To open the app from a phone or another PC on the same Wi-Fi:

**Step 1 — Find your machine's local IP:**
```bash
# macOS / Linux
ipconfig getifaddr en0      # or: ip route get 1 | awk '{print $7}'

# Windows
ipconfig                    # look for "IPv4 Address"
```

**Step 2 — Start both servers with network access:**
```bash
# Backend
uvicorn main:app --reload --host 0.0.0.0 --port 3001

# Frontend (in a separate terminal)
npm run dev -- --host
```

**Step 3 — Frontend API URL (optional):**

By default, the frontend automatically connects to the same host the browser is on, so **no `.env` change is needed** when switching networks.

If you need to override it (e.g. pointing to a remote server), set:
```env
VITE_API_URL=http://<your-server-ip>:3001/api
```
> ⚠️ **Do not hardcode a local IP here.** It will break whenever your network changes. Omit this variable to use the dynamic fallback (`window.location.hostname`).

**Step 4 — CORS is already configured for local network access.**

`backend/main.py` reads your IP from the `.env` file automatically:
```python
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    f"http://{os.getenv('LOCAL_IP', '')}:5173",   # ← loaded from .env
]
```
Just make sure your `backend/.env` has the correct value:
```env
LOCAL_IP=192.168.x.x   # replace with your current local IP
```
> 💡 **This is the only value you need to update when switching networks.** Everything else adjusts automatically.

**Step 5 — Open on the other device:**
```
http://192.168.x.x:5173
```

> **Note:** `LOCAL_IP` in `.env` is used by `main.py` to dynamically include your machine's IP in the CORS whitelist without hardcoding it in source code.

---

### 5. Verify Everything is Running

Once all three components are started, check:

✅ Backend API: `http://localhost:3001/docs`  
✅ Frontend App: `http://localhost:5173`  
✅ Test login with demo account:
- Email: `alice@example.com`
- Password: `password123`

---

## Demo Accounts

After importing `sample_data.sql`, two accounts are available for testing:

| Name | Email | Password |
|---|---|---|
| Alice Nguyen | alice@example.com | password123 |
| Bob Tran | bob@example.com | password123 |

---

## Environment Variables

### Backend — `backend/.env`

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=finance_app
DB_PASS=your_db_password
DB_NAME=PersonalFinance

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# CORS — frontend URL (Vite default)
FRONTEND_URL=http://localhost:5173

# Your machine's local IP (used for CORS + network access)
LOCAL_IP=192.168.x.x
```

### Frontend — `frontend/.env`

```env
# Point to localhost for local dev, or to LOCAL_IP for network access
VITE_API_URL=http://localhost:3001/api
```

---

## Required Frontend Config Files

**These files must exist in `frontend/` root folder:**

### `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
  },
})
```

### `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
}
```

### `postcss.config.js`

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## Important: Package.json Versions

**Use these STABLE versions in `frontend/package.json`:**

```json
{
  "dependencies": {
    "axios": "^1.7.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.1",
    "recharts": "^2.12.7"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "tailwindcss": "^3.4.10",
    "vite": "^5.4.1"
  }
}
```

**❌ Do NOT use:**
- `vite@8` — Too new, breaking changes
- `react@19` — Not fully stable
- `tailwindcss@4` — New config format
- `@vitejs/plugin-react@6` — Incompatible with Vite 5

**If you have wrong versions:**
```bash
rm -rf node_modules package-lock.json
npm install  # Will use correct versions from package.json
```