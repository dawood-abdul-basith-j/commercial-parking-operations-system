# Commercial Parking Operations System (CPOS)

Enterprise-grade, full-stack commercial parking operations and management platform built with modern web technologies, strict Role-Based Access Control (RBAC), immutable audit logging, and real-time facility slot visualization.

---

## 🚀 Key Features Implemented

### 1. Production UI & Visual Facility Floor Map
- **Interactive Parking Lot Visualizer**: Real-time multi-floor (`Floor L1` & `Floor L2`) interactive slot grid mapping with capacity and type breakdown:
  - 🟢 **Vacant**: Interactive slots that immediately pre-fill the reservation form upon click.
  - 🔴 **Occupied**: Telemetry showing active vehicles parked in real time.
  - 🟡 **Reserved**: Slots with confirmed incoming bookings.
  - ⚡ **Specialized Bays**: Dedicated tags for **EV Charging**, **Accessible (Handicap)**, **Compact**, and **VIP / Reserved** bays.
- **Advanced Operations Toolbar**: Real-time search query filter (by ID, slot, status, or date) and instant status filter tabs (`ALL`, `ACTIVE`, `CONFIRMED`, `COMPLETED`, `CANCELLED`).
- **Production Enterprise Aesthetics**: Sleek Slate & Cobalt theme, Plus Jakarta Sans typography, JetBrains Mono for identifiers, live status heartbeat chips, and responsive layout across desktop and mobile devices.

### 2. Multi-Tier Role-Based Access Control (RBAC)
Strict client-and-server-enforced boundaries conforming to SRS Section 2.3 user classes:

| Role | Access Scope & Capabilities |
| :--- | :--- |
| **Customer (`CUSTOMER`)** | Can register or sign in, reserve parking slots for their verified vehicles, view personal booking records, and cancel own pending/confirmed reservations. |
| **Parking Operator (`PARKING_OPERATOR`)** | Manages parking operations at assigned locations, creates walk-in/dispatch bookings on behalf of customer IDs, and controls entry/exit status transitions (`CONFIRMED` ➔ `ACTIVE` ➔ `COMPLETED`). |
| **Branch Manager (`BRANCH_MANAGER`)** | Monitors all operator reservations and capacity across branch layouts, manages overrides, and tracks branch operations. |
| **Super Administrator (`SUPER_ADMINISTRATOR`)** | System-wide visibility across all branch locations, role assignments, and exclusive access to the **Security & Compliance Audit Trail Engine**. |

### 3. Authentication & Security Engine
- **Password Authentication**: Bcrypt-hashed password storage (cost factor 10–12) with password visibility toggle ("eye" icon).
- **Google OAuth 2.0 Integration**: Server-verified Google Identity Services (GIS) ID tokens via `google-auth-library` (`OAuth2Client.verifyIdToken()`). Automated customer provisioning with duplicate-safe unique constraints.
- **JWT Session Persistence**:
  - Secure tokens with 1-hour expiration.
  - Automatic `localStorage` session preservation on browser refresh.
  - History protection trapping back-arrow navigation (`popstate`) to prevent accidental session exit.
  - Immediate local session purge upon token expiry or `HTTP 401 Unauthorized` responses.
- **Audit Logging**: Write-ahead audit trails tracking all authentication events and privileged operations.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite), Vanilla CSS design system (tokens, glassmorphism, micro-animations), Google Identity Services.
- **Backend**: Node.js, Express.js, JWT (`jsonwebtoken`), Bcrypt, Google Auth Library (`google-auth-library`), MySQL2 with connection pooling and transactions.
- **Database**: MySQL 8.0+ relational schema (`cpos_schema_test`) with foreign key constraints and ACID transaction rollbacks.

---

## 🧪 Quick Demo Access Accounts

For evaluation and testing, preset test accounts are provisioned in the database with the default password `Test@12345`:

| Persona | Role in System | Email | Password |
| :--- | :--- | :--- | :--- |
| 👑 **Super Admin** | `SUPER_ADMINISTRATOR` | `cpos.test.auditadmin@example.com` | `Test@12345` |
| 🏢 **Branch Manager** | `BRANCH_MANAGER` | `cpos.test.manager.day2@example.com` | `Test@12345` |
| 🛠️ **Parking Operator** | `PARKING_OPERATOR` | `cpos.test.operator.day2@example.com` | `Test@12345` |
| 🚗 **Customer** | `CUSTOMER` | `day2.customer@example.com` | `Test@12345` |

*(On the sign-in screen, click any persona chip in the **Quick Demo Access** bar to automatically fill credentials.)*

---

## ⚙️ Environment Configuration

### Backend (`backend/.env`)
```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=cpos_schema_test
JWT_SECRET="your_secure_random_jwt_secret_here"
JWT_EXPIRES_IN=1h
GOOGLE_CLIENT_ID="530024911696-55cmqjlldqjgg58vu8cppkvl20u6i39s.apps.googleusercontent.com"
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID="530024911696-55cmqjlldqjgg58vu8cppkvl20u6i39s.apps.googleusercontent.com"
```

---

## 🚦 Getting Started

### 1. Database Setup
Ensure MySQL is running and import the database schema:
```bash
mysql -u root -p < database/schema_srs.sql
```

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
Backend runs on `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## 🛡️ API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /register`: Register new customer profile.
- `POST /login`: Authenticate with email/password and obtain JWT.
- `POST /google-login`: Authenticate with Google ID token.
- `GET /me`: Get authenticated user profile (`Bearer` token required).

### Bookings (`/api/bookings`)
- `POST /`: Create reservation (Customer or Operator).
- `GET /`: Retrieve paginated reservations (scoped by RBAC role).
- `GET /:id`: Retrieve reservation details by ID.
- `PATCH /:id/status`: Update booking lifecycle state (`PENDING` ➔ `CONFIRMED` ➔ `ACTIVE` ➔ `COMPLETED` / `CANCELLED`).

### Audit Trail (`/api/audit-logs`)
- `GET /`: Retrieve system audit logs (Restricted to `SUPER_ADMINISTRATOR`).

### Operations & SRS Features (`/api/operations`)
- `GET /qr/:bookingId`: Generate dynamic Gate Entry QR & verification OTP (FR-3.3).
- `POST /verify-entry`: Operator Gate Scanner check-in & slot lock (FR-3.3).
- `POST /verify-exit`: Operator Gate Scanner check-out, slot release & billing finalization (FR-3.3).
- `POST /payments`: Process digital payments (UPI, Card, Net Banking) & settle balances (FR-3.4).
- `GET /invoices`: View digital tax invoices and payment receipts (FR-3.4).
- `GET /queue`: Live virtual waiting queue tracking by parking lot (FR-3.6).
- `POST /queue/join`: Enqueue customer vehicle when slots are fully booked (FR-3.6).
- `GET /valet`: Digital valet tracking, vehicle location & key-tag management (FR-3.7).
- `POST /valet/:taskId/retrieve`: Customer valet retrieval request (FR-3.7).
- `GET /violations`: List issued parking violation notices & fines (FR-3.8).
- `POST /violations`: Issue penalty notice for unauthorized parking / overtime (FR-3.8).
- `POST /violations/:id/dispute`: Submit customer fine dispute for manager review (FR-3.8).
- `GET /analytics`: Multi-metric operational reporting (Occupancy rate, total revenue, average duration, peak hours) (FR-3.9).