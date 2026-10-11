
# CPOS — API and Security Review

## 1. Project Overview

Commercial Parking Operations System (CPOS) is a web-based parking
management application. Its backend uses Node.js, Express.js, and MySQL.

Current focus:
- Customer authentication and authorization
- Parking booking creation and retrieval
- Booking conflict prevention
- Role- and location-scoped access
- Booking status management
- Pagination and audit logging

## 2. Technology Stack

- Frontend: React and Vite
- Backend: Node.js and Express.js
- Database: MySQL/MariaDB
- Password hashing: bcrypt
- Authentication: JSON Web Tokens (JWT)
- Database driver: mysql2/promise
- Login and registration rate limiting: express-rate-limit

## 3. API Endpoints

### Authentication

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| POST | /api/auth/register | Register a customer | Public |
| POST | /api/auth/login | Authenticate a user and issue JWT | Public |
| GET | /api/auth/me | Retrieve the authenticated profile | Authenticated |

### Bookings

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| POST | /api/bookings | Create a booking | Authenticated |
| GET | /api/bookings | List authorized bookings | Authenticated |
| GET | /api/bookings/:id | Retrieve one authorized booking | Authenticated |
| PATCH | /api/bookings/:id/status | Update booking status | Authenticated, subject to authorization |

### Health Checks

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/health | Check backend availability |
| GET | /api/health/db | Check database connectivity |

## 4. Authentication

Customer registration:
- Validates required fields.
- Hashes passwords with bcrypt.
- Assigns the CUSTOMER role on the server.
- Creates user and customer records in a transaction.
- Writes an audit entry when registration succeeds.

Login:
- Checks the submitted credentials.
- Rejects inactive accounts.
- Issues a signed JWT after successful authentication.
- Uses the JWT subject to identify the user.
- Records successful login events in the audit table.

Tokens are supplied using:

Authorization: Bearer <access-token>

JWT_SECRET is stored in backend/.env and must never be committed to Git.

## 5. Authorization Rules

### Customer

- Can retrieve only their own bookings.
- Cannot create a booking using another customer's identity.
- Can cancel their own PENDING or CONFIRMED bookings.
- Cannot confirm, activate, or complete their own booking.

### Parking Operator

- Must have an active operator assignment.
- Can access bookings for the assigned parking location.
- Cannot access bookings belonging to other locations.

### Branch Manager

- Currently uses the same location-assignment model as an operator.
- Access is restricted to the assigned location.
- Multi-location branch access is not implemented.

### Super Administrator

- The SUPER_ADMINISTRATOR role is recognized as system-wide by the current
  booking-scope implementation.
- Complete administrator provisioning and authorization testing remain to
  be demonstrated.

## 6. Booking Validation

- Customer, vehicle, and slot references must be valid.
- A customer must own the vehicle used for their booking.
- The requested parking slot must be active.
- Exit time must be later than entry time.
- Invalid calendar dates and malformed timestamps are rejected.
- Booking source is restricted to supported values.
- Overlapping reservations for the same slot are rejected.
- Booking lists support pagination with a maximum page size of 100.

## 7. Booking Status Transitions

| Current Status | Next Status | Allowed |
|---|---|---|
| PENDING | CONFIRMED | Yes |
| PENDING | CANCELLED | Yes |
| CONFIRMED | CANCELLED | Yes |
| CONFIRMED | ACTIVE | Yes |
| ACTIVE | COMPLETED | Yes |
| CANCELLED | Any other status | No |
| COMPLETED | Any other status | No |

Customers may only cancel their own eligible bookings.
Staff status changes are restricted by the configured transition rules.

## 8. Audit Logging

The audit_logs table records:
- User ID
- Module name
- Action
- IP address
- Timestamp

Implemented audit events include:
- CUSTOMER_REGISTERED
- LOGIN_SUCCESS
- Booking creation
- Booking status changes

Audit entries must never contain passwords, password hashes, JWTs, or
authorization headers.

## 9. Verified Development Tests

Previously observed successful checks:
- Customer registration
- Customer login and JWT generation
- Rejection of unauthenticated booking requests
- Retrieval of the authenticated profile
- Prevention of customer booking impersonation
- Rejection of access to another customer's booking
- Operator access to an assigned-location booking
- Rejection of cross-location access for an operator
- Rejection of cross-location access for a branch manager
- Booking creation and overlap prevention
- Invalid time-range rejection
- Booking status transition validation
- Pagination success and invalid-page rejection

Audit persistence and the final regression run should be confirmed against
the latest saved code before claiming they pass.

## 10. Known Limitations

- True multi-location branch authorization is not implemented.
- Super-administrator authorization still needs dedicated testing.
- Audit-log persistence must be verified after the latest changes.
- Refresh tokens and token revocation are not implemented.
- The current in-memory rate limiter is intended for local development.
- Automated CI and deployment pipelines are not configured.
- Production deployment requires additional security review.

## 11. Git Workflow

Current development branch:
feature/authentication-authorization

Changes are kept local during development.
Do not push or merge into develop without explicit approval.
