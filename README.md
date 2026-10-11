# Commercial Parking Operations System (CPOS)

[![CI Pipeline](https://github.com/dawoodabdulbasith/commercial-parking-operations-system/actions/workflows/ci.yml/badge.svg)](https://github.com/dawoodabdulbasith/commercial-parking-operations-system/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-orange.svg)](https://www.mysql.com/)

An enterprise-grade, full-stack **Commercial Parking Operations System (CPOS)** engineered for high-throughput commercial parking lots, airports, shopping malls, and corporate campuses. Built strictly conforming to Software Requirements Specification (SRS) standards, featuring multi-tier Role-Based Access Control (RBAC), immutable security audit logging, distributed rate limiting, real-time multi-floor visual slot tracking, automated smart overflow queue management, and comprehensive client-side route resolution.

---

## 📑 Table of Contents

- [Executive Summary & Architecture](#-executive-summary--architecture)
- [System Architecture Diagram](#-system-architecture-diagram)
- [Technical Stack & Infrastructure](#-technical-stack--infrastructure)
- [Comprehensive Module Breakdown](#-comprehensive-module-breakdown)
  - [1. Authentication, Sessions & Security Shield](#1-authentication-sessions--security-shield)
  - [2. Multi-Tier Role-Based Access Control (RBAC)](#2-multi-tier-role-based-access-control-rbac)
  - [3. Interactive Floor Map & Slot Visualizer](#3-interactive-floor-map--slot-visualizer)
  - [4. Bookings & Reservation Lifecycle](#4-bookings--reservation-lifecycle)
  - [5. Smart Gate Scanner & Entry/Exit Tokens (FR-3.3)](#5-smart-gate-scanner--entryexit-tokens-fr-33)
  - [6. Digital Payments & Tax Invoices (FR-3.4)](#6-digital-payments--tax-invoices-fr-34)
  - [7. Smart Virtual Queue & Overflow Management (FR-3.6)](#7-smart-virtual-queue--overflow-management-fr-36)
  - [8. Digital Valet Service & Key Dispatch (FR-3.7)](#8-digital-valet-service--key-dispatch-fr-37)
  - [9. Compliance, Enforcement & Violation Disputes (FR-3.8)](#9-compliance-enforcement--violation-disputes-fr-38)
  - [10. Executive Analytics & Telemetry Reports (FR-3.9)](#10-executive-analytics--telemetry-reports-fr-39)
  - [11. Super Administrator Immutable Audit Trail](#11-super-administrator-immutable-audit-trail)
  - [12. Enterprise White & Blue 404 Overview & Incident Reporting](#12-enterprise-white--blue-404-overview--incident-reporting)
- [URL Routing Architecture & Route Synchronization](#-url-routing-architecture--route-synchronization)
- [Security & Defense-in-Depth Mechanisms](#-security--defense-in-depth-mechanisms)
- [Database Architecture & Data Integrity](#-database-architecture--data-integrity)
- [REST API Reference](#-rest-api-reference)
- [Demo Personas & Test Credentials](#-demo-personas--test-credentials)
- [Environment Configuration](#-environment-configuration)
- [Installation & Local Deployment](#-installation--local-deployment)
- [Testing & Quality Assurance](#-testing--quality-assurance)

---

## 🏛️ Executive Summary & Architecture

CPOS addresses modern urban parking challenges: slot scarcity, entry bottlenecks, unrecorded cash transactions, overstay compliance, and customer wait times. The system combines an asynchronous Node.js/Express REST API backend with a high-performance React (Vite) single-page application, bound to a resilient MySQL database via connection pools and transaction rollbacks.

### Key Architectural Highlights:
1. **Decoupled Client-Server Model**: RESTful stateless JSON communication guarded by JSON Web Tokens (`Bearer` authorization header).
2. **Deterministic State Machine**: Strictly enforced booking statuses (`PENDING` ➔ `CONFIRMED` ➔ `ACTIVE` ➔ `COMPLETED` / `CANCELLED`).
3. **Resilient Browser History Management**: Full pathname and hash routing synchronization (`window.history.pushState` and `popstate` listeners) with role-preserving auth guards.
4. **Defensive Security Perimeter**: Express rate limiters protecting authentication endpoints from brute force attacks, parameterized SQL inputs shielding from SQL injection, and bcrypt salt hashing.

---

## 🗺️ System Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT BROWSER                                    |
|   React (Vite) Single Page App + Plus Jakarta Sans + Modern Slate & Cobalt CSS    |
|   History PushState Router | Live SVG Visualizer | QR Pass & Invoice Modals       |
+-----------------------------------------------------------------------------------+
                                   │           ▲
                HTTPS / REST JSON  │           │  JWT Token + Telemetry
                                   ▼           │
+-----------------------------------------------------------------------------------+
|                                EXPRESS.JS BACKEND                                 |
|                                                                                   |
|  [Rate Limiter] ---> [CORS & JSON Body Parser] ---> [JWT Auth Middleware]         |
|  - Login: 10/15min                                  - Bearer Token Validation     |
|  - Register: 5/hr                                   - Role Authorization Guards   |
|                                                                                   |
|  +--------------------+--------------------+--------------------+--------------+  |
|  | Auth Routes        | Booking Routes     | Operations Routes  | Audit Logs   |  |
|  | - Bcrypt / Google  | - Slot Locking     | - Gate Entry/Exit  | - Write-Ahead|  |
|  | - Token Issuance   | - RBAC Filters     | - Queue / Valet    | - Immutable  |  |
|  +--------------------+--------------------+--------------------+--------------+  |
+-----------------------------------------------------------------------------------+
                                   │           ▲
                 MySQL2 Connection │           │  ACID Transactions
                       Pool (Pool) │           │  Row-Level Locking
                                   ▼           │
+-----------------------------------------------------------------------------------+
|                                 MYSQL 8.0 DATABASE                                |
|  - users                 - parking_slots      - bookings        - vehicles        |
|  - queue_entries         - valet_tasks        - violations      - invoices        |
|  - payments              - audit_logs         - parking_lots                      |
+-----------------------------------------------------------------------------------+
```

---

## 💻 Technical Stack & Infrastructure

### Frontend Architecture
- **Framework**: React 18+ powered by Vite 8 for instant HMR and lightweight bundle sizes.
- **Styling**: Native Vanilla CSS Design System with curated variables (`--primary-600: #2563eb`, `--bg-page: #f8fafc`), glassmorphism, responsive CSS Grid/Flexbox layouts, and zero heavy styling dependencies.
- **Typography**: Google Fonts (*Plus Jakarta Sans* for headings/body, *JetBrains Mono* for IDs and telemetry).
- **Authentication**: Integrated Google Identity Services (GIS) button alongside email/password form.
- **Vector Graphics**: Lightweight inline SVG iconography for zero external icon library overhead.

### Backend Architecture
- **Runtime**: Node.js (LTS).
- **Web Framework**: Express.js with custom modular routing.
- **Security & Crypto**:
  - `jsonwebtoken` (JWT) for cryptographically signed session tokens.
  - `bcrypt` with salt rounds 10–12 for irreversibly hashed password verification.
  - `google-auth-library` (`OAuth2Client`) for cryptographic backend Google token verification.
  - `express-rate-limit` for IP-based brute force and spam mitigation.
- **Database Driver**: `mysql2/promise` utilizing connection pools (`createPool`) and transactional commits/rollbacks.

---

## 📦 Comprehensive Module Breakdown

### 1. Authentication, Sessions & Security Shield
- **Dual Sign-In Channels**:
  - **Standard Email & Password**: Email normalization, password length requirements, and client-side password toggle.
  - **Google One-Tap / Sign-In**: Authenticates via GIS ID token sent to `/api/auth/google-login`. The backend extracts email, sub, and name, and either finds or auto-provisions a `CUSTOMER` account.
- **Distributed Rate Limiting**:
  - **Login Route (`/api/auth/login`)**: Limited to **10 requests per 15 minutes** per IP (`loginLimiter`). Exceeding returns `HTTP 429 Too Many Requests`.
  - **Registration Route (`/api/auth/register`)**: Limited to **5 account creations per hour** per IP (`registerLimiter`).
- **Session Continuity**: Tokens and user profiles stored in `localStorage` (`cpos_token`, `cpos_user`). Automatically validated against `/api/auth/me` on initial boot.
- **Session Auto-Purge**: On token expiration or `HTTP 401 Unauthorized`, sessions are cleanly wiped, and the user is routed to `/login`.

### 2. Multi-Tier Role-Based Access Control (RBAC)
Every endpoint validates `req.user.role`. Access rules match SRS Section 2.3:

| System Role | Scope & Permissions | Permitted Actions |
| :--- | :--- | :--- |
| **`CUSTOMER`** | Personal Vehicle Owner | Create reservations, view personal booking history, cancel pending/confirmed bookings, view personal entry QR passes, pay invoices, submit violation disputes, join/leave virtual queue. |
| **`PARKING_OPERATOR`** | On-Site Facility Attendant | Full gate scanner control (QR/OTP check-in & check-out), walk-in booking creation for customer IDs, manual status progression (`CONFIRMED` ➔ `ACTIVE` ➔ `COMPLETED`), manage virtual queue members, execute valet check-in/retrieval. |
| **`BRANCH_MANAGER`** | Facility Branch Supervisor | Branch-wide operations monitoring, review violation disputes, override slot allocations, view detailed revenue analytics, manage virtual queue waitlists. |
| **`SUPER_ADMINISTRATOR`** | Global Enterprise Executive | Full root access across all branch facilities, system-wide configuration, and exclusive access to the **Immutable Security Audit Log Engine**. |

### 3. Interactive Floor Map & Slot Visualizer
- **Multi-Level Facility Support**: Instant switching between Floor `L1` and Floor `L2`.
- **Live Status Coloring**:
  - 🟢 **Vacant**: Highlights available slots. Clicking a vacant slot immediately populates the slot ID in the reservation form.
  - 🔴 **Occupied**: Active vehicles parked with live telemetry.
  - 🟡 **Reserved**: Incoming booking scheduled.
- **Specialized Bay Classifications**: Standard, EV Charging (`EV` icon), Accessible / Handicap, and Compact bays.
- **Occupancy Header**: Real-time counters showing total capacity, occupied slots, available slots, and percentage occupancy.

### 4. Bookings & Reservation Lifecycle
- **Status Lifecycle State Machine**:
  ```
  [PENDING] ----> [CONFIRMED] ----> [ACTIVE] ----> [COMPLETED]
     |                 |
     +---> [CANCELLED] <+
  ```
- **Overlap Prevention**: Enforces slot availability check before creating bookings to prevent double-booking.
- **Real-Time Search & Status Filtering**: Search instantly by Booking ID, Slot Number, Vehicle License, or Customer Name, paired with status tab filters (`ALL`, `ACTIVE`, `CONFIRMED`, `COMPLETED`, `CANCELLED`).
- **Paginated Table**: Backend pagination with dynamic page size and total page metrics.

### 5. Smart Gate Scanner & Entry/Exit Tokens (FR-3.3)
- **Digital Entry Pass**: Accessible by customers via the `🎟️ Pass` button. Displays dynamic QR code, Booking Reference, Slot Number, and an 8-character verification OTP.
- **Operator Gate Scanner UI**:
  - **Inbound Gate Verification**: Operator enters or scans OTP/Booking ID. Automatically verifies reservation validity, marks status as `ACTIVE`, locks slot as occupied, and records entry timestamp.
  - **Outbound Gate Checkout**: Operator enters Booking ID. Automatically calculates parking duration, verifies payment/invoice status, marks booking as `COMPLETED`, releases slot to `VACANT`, and logs outbound checkout.

### 6. Digital Payments & Tax Invoices (FR-3.4)
- **Payment Processing**: Supports Card, UPI, and Net Banking payment options.
- **Invoice Generation**: Automated generation of digital commercial invoices with unique sequential invoice numbers (`INV-XXXXXX`), billing timestamps, duration rates, and tax calculations.
- **Printable Modal**: Invoice modal view with full tax breakdown and instant print action.

### 7. Smart Virtual Queue & Overflow Management (FR-3.6)
- **Automated Overflow Activation**: Customers can join the virtual queue **only when all slots in the facility are completely occupied**. If slots remain available, the system enforces direct slot reservation.
- **Role-Based Waitlist Controls**:
  - **Customer**: Can join the waitlist and cancel/remove their *own* entry.
  - **Operator / Manager / Admin**: Can view the entire queue roster, monitor wait times, call up next-in-line vehicles when a slot frees up, or remove members from the queue.
- **Queue Metrics**: Live display of current waiting count, average wait time, and queue position number.

### 8. Digital Valet Service & Key Dispatch (FR-3.7)
- **Key-Tag Tracking**: Assigns unique valet key tags and physical parking slot locations to customer vehicles.
- **Customer Retrieval Request**: Customers can send a digital retrieval ping to the valet desk when preparing to leave.
- **Valet Status Workflow**: Tracks status transitions: `VEHICLE_RECEIVED` ➔ `PARKED` ➔ `RETRIEVAL_REQUESTED` ➔ `RETURNED`.

### 9. Compliance, Enforcement & Violation Disputes (FR-3.8)
- **Violation Logging**: Staff and operators can record parking violations with vehicle plate, violation type (`OVERSTAY`, `UNAUTHORIZED_SLOT`, `NO_RESERVATION`), and penalty fine amounts.
- **Customer Dispute Workflow**: Customers can submit structured dispute explanations against issued penalties directly from their dashboard.
- **Supervisor Adjudication**: Branch managers review dispute logs and either dismiss or uphold fines with audit trail accountability.

### 10. Executive Analytics & Telemetry Reports (FR-3.9)
- **Accessible to Branch Managers & Super Administrators**.
- **Real-Time KPIs**:
  - Facility Occupancy Percentage.
  - Gross Revenue Settled.
  - Total Active & Completed Bookings.
  - Average Parking Duration (hours/minutes).
  - Peak Utilization Hour Identification.

### 11. Super Administrator Immutable Audit Trail
- **Write-Ahead Security Logging**: The backend `auditLogger.js` captures:
  - User ID and Actor Email.
  - Action Category (e.g. `USER_LOGIN`, `BOOKING_CREATED`, `GATE_ENTRY`, `VIOLATION_ISSUED`).
  - Target Entity ID.
  - Client IP Address and User-Agent.
  - Full Request Payload State (before/after).
- **Dedicated Audit Log Viewer**: Dedicated table with actor filters, monospace timestamps, and detailed JSON inspection.

### 12. Enterprise White & Blue 404 Overview & Incident Reporting
- **Open Full-Page Layout**: Replaced traditional floating dark boxes with an open, high-aesthetic layout matching CPOS's clean white and cobalt blue design system.
- **Operations Header**: Topbar with CPOS brand badge and live pulse telemetry indicator (`Facility Sector: 404 Unresolved`).
- **Clear Diagnostic Messaging**: Highlights the unrecognized route `/{currentRoutePath}` with status codes.
- **Dedicated Incident Report Box**:
  - Displays primary support email: `dawoodabdulbasith24bcs054@gmail.com`.
  - **"Report via Email"** CTA: Auto-opens user mail client with pre-filled route, timestamp, and incident telemetry.
  - **"Copy Email"** CTA: Copies `dawoodabdulbasith24bcs054@gmail.com` with real-time feedback.
- **Context-Aware Return CTA**: Seamlessly returns authenticated users to their core dashboard or guest visitors to the login portal.

---

## 🧭 URL Routing Architecture & Route Synchronization

CPOS implements a robust dual-mode routing resolver (`resolveRoute`) supporting standard HTML5 pathnames and hash fallbacks:

```
Browser URL ──► resolveRoute() ──► { tab, authMode, raw } ──► Set State ──► Render View
```

### Route Table:

| URL Path | Primary View | Access Guard | Aliases |
| :--- | :--- | :--- | :--- |
| **`/`**, **`/dashboard`** | Core Operations Dashboard | Authenticated | `/bookings`, `/reservations`, `/parking`, `/map`, `/audit`, `/logs` |
| **`/login`** | Sign In Screen | Public | Auth switcher |
| **`/register`** | Account Creation | Public | Auth switcher |
| **`/gate`** | Operator Gate Scanner | Staff / Operator | `/scanner` |
| **`/queue`** | Virtual Queue System | Authenticated | `/virtual-queue` |
| **`/valet`** | Valet Parking Dispatch | Authenticated | `/valet` |
| **`/violations`** | Violations & Dispute Resolution | Authenticated | `/compliance`, `/disputes` |
| **`/analytics`** | Executive Reports & Analytics | Manager / Admin | `/reports` |
| **`/*` (Any Invalid Route)** | Enterprise 404 Overview | Public | Direct error telemetry & support report |

- **Popstate & Hash Synchronization**: Active event listeners ensure browser Back and Forward navigation update the application view without full page reloads.
- **Post-Login Target Preservation**: Attempting to access a protected route (e.g., `/queue`) while unauthenticated preserves the target route; upon successful login, the user is navigated directly to their requested destination.

---

## 🔒 Security & Defense-in-Depth Mechanisms

1. **Authentication Rate Limiting**:
   - `loginLimiter`: 10 attempts / 15 minutes.
   - `registerLimiter`: 5 attempts / 60 minutes.
2. **Cryptographic Integrity**:
   - Passwords hashed with bcrypt (salt factor 10).
   - JWT tokens signed with secure `JWT_SECRET` and configured expiration.
   - Google ID tokens verified cryptographically against Google's public certs.
3. **Database Security**:
   - Strict parameterized queries (`?`) using `mysql2` prepared statements eliminating SQL injection vulnerabilities.
   - ACID transaction isolation for booking creation and status transitions.
4. **Audit Trail Immutability**:
   - All authorization and state modifications written to `audit_logs` table.

---

## 📊 Database Architecture & Data Integrity

The relational database (`cpos_schema_test`) models commercial parking facilities with foreign key relationships:

```
users (id, email, password_hash, role, driving_license_number, ...)
  │
  ├──< bookings (id, customer_id, slot_id, status, expected_entry, expected_exit, ...)
  │      │
  │      ├──< payments (id, booking_id, amount, payment_method, status)
  │      └──< invoices (id, booking_id, invoice_number, total_amount, tax)
  │
  ├──< queue_entries (id, customer_id, lot_id, queue_number, status)
  ├──< valet_tasks (id, booking_id, vehicle_id, key_tag, status)
  ├──< violations (id, vehicle_number, violation_type, fine_amount, status, dispute_reason)
  └──< audit_logs (id, user_id, action, entity_id, ip_address, details, created_at)

parking_slots (id, lot_id, slot_number, floor_level, slot_type, is_active)
```

---

## 📡 REST API Reference

### Authentication Endpoints (`/api/auth`)
- `POST /register`: Registers customer account. *(Rate limited: 5/hr)*
- `POST /login`: Authenticates user, returns JWT and user profile. *(Rate limited: 10/15min)*
- `POST /google-login`: Validates Google GIS token, provisions or logs in customer.
- `GET /me`: Returns profile of the current JWT bearer.

### Booking Endpoints (`/api/bookings`)
- `POST /`: Creates a new parking slot reservation.
- `GET /`: Retrieves paginated reservations (scoped by RBAC role).
- `GET /:id`: Retrieves booking details by ID.
- `PATCH /:id/status`: Updates lifecycle status (`PENDING`, `CONFIRMED`, `ACTIVE`, `COMPLETED`, `CANCELLED`).

### Operations Endpoints (`/api/operations`)
- `GET /qr/:bookingId`: Generates entry QR token data and 8-character verification OTP.
- `POST /verify-entry`: Gate scanner check-in (marks `ACTIVE` and locks slot).
- `POST /verify-exit`: Gate scanner check-out (marks `COMPLETED` and releases slot).
- `POST /payments`: Settles balance via Card, UPI, or Net Banking.
- `GET /invoices`: Returns invoice history for bookings.
- `GET /queue`: Returns live virtual queue entries.
- `POST /queue/join`: Enqueues customer vehicle when lot is 100% full.
- `DELETE /queue/:id`: Removes member from queue (Customer for own entry; Staff for any entry).
- `GET /valet`: Returns valet dispatch tasks.
- `POST /valet/:taskId/retrieve`: Pings valet desk for vehicle retrieval.
- `GET /violations`: Lists issued violation notices and fines.
- `POST /violations`: Issues a new violation citation.
- `POST /violations/:id/dispute`: Submits customer dispute explanation.
- `GET /analytics`: Multi-metric operational telemetry (Occupancy, Revenue, Peak hours).

### Audit Trail (`/api/audit-logs`)
- `GET /`: Returns paginated audit trail logs *(Super Administrator exclusive)*.

---

## 👥 Demo Personas & Test Credentials

Pre-configured test accounts are available in the database for immediate evaluation. All accounts use password: `Test@12345`.

| Persona | Role Code | Email | Password | Primary Dashboard Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| 👑 **Super Administrator** | `SUPER_ADMINISTRATOR` | `cpos.test.auditadmin@example.com` | `Test@12345` | Global audit logs, analytics, all modules |
| 🏢 **Branch Manager** | `BRANCH_MANAGER` | `cpos.test.manager.day2@example.com` | `Test@12345` | Revenue analytics, dispute review, queue |
| 🛠️ **Parking Operator** | `PARKING_OPERATOR` | `cpos.test.operator.day2@example.com` | `Test@12345` | Gate scanner (QR/OTP), walk-in bookings |
| 🚗 **Customer** | `CUSTOMER` | `day2.customer@example.com` | `Test@12345` | Reserve slots, view passes, pay invoices |

*(On the sign-in screen, click any persona chip in the **Quick Demo Access** bar to automatically load credentials.)*

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
JWT_SECRET="cpos_production_jwt_super_secret_key_2026"
JWT_EXPIRES_IN=1h
GOOGLE_CLIENT_ID="530024911696-55cmqjlldqjgg58vu8cppkvl20u6i39s.apps.googleusercontent.com"
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID="530024911696-55cmqjlldqjgg58vu8cppkvl20u6i39s.apps.googleusercontent.com"
```

---

## 🚦 Installation & Local Deployment

### 1. Database Initialization
Ensure MySQL service is active and import the database schema:
```bash
mysql -u root -p < database/schema_srs.sql
```

### 2. Backend Service
```bash
cd backend
npm install
npm run dev
```
Backend API will boot at `http://localhost:5000`.

### 3. Frontend Application
```bash
cd frontend
npm install
npm run dev
```
Frontend development server will boot at `http://localhost:5173`.

---

## 🧪 Testing & Quality Assurance

### Smoke & Integration Tests
Backend smoke tests validate health check, authentication failure handling, rate limiting, and database connectivity:
```bash
cd backend
npm test
```

### Frontend Production Build
```bash
cd frontend
npm run build
```

---

## 📄 License & Attribution

Developed under the **MIT License**. Built as a reference implementation for commercial parking operations and facility automation.