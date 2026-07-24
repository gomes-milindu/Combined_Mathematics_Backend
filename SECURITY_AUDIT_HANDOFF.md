# Project Overview

- **Backend status**: Secured against basic data exposure, mass assignment, and unauthenticated access. Resides on branch `anupa2`.
- **Frontend status**: Outdated, read-only state. Completely incompatible with the newly secured backend.
- **Authentication status**: JWT-based authentication is fully active and enforced on the backend.
- **Route protection status**: 15 out of 18 routes are strictly protected by authentication and role-based middleware. 3 routes intentionally remain public.

---

# Completed Security Work

- **Stripped password hashes** from all API responses (e.g., `.select("-password")` and `.toObject()`) in `adminController.js` and `studentController.js`.
- **Remediated mass assignment** vulnerabilities by implementing a strict field allowlist in the `editStudent` controller.
- **Cleaned up logging** by replacing insecure `console.error`/`console.log` calls with structured Pino logging (`req.log`).
- **Added null safety checks** to `createPayment` to prevent server crashes on invalid IDs.
- **Implemented fail-fast startup validation** for `JWT_SECRET` in `index.js`.
- **Created centralized auth middleware** (`authenticate`, `requireAuth`, `requireAdmin`, `requireRole`) in `authMiddleware.js`.
- **Applied Route Protection** to all relevant routes across `adminRouter`, `studentRouter`, `addCourse`, `pricingRouter`, `paymentRouter`, and `dashboardRoute`.
- **~~SEC-001~~ FIXED**: Removed deprecated npm `crypto` package from `package.json`. Node.js provides `crypto` as a built-in module. Commit: `1f770b7`.
- **~~SEC-002~~ FIXED**: Added IDOR ownership check in `getStudentById` (`studentController.js`). Students can only view their own profile; admins can view any. Commit: `55772aa`.
- **~~SEC-003~~ FIXED**: Sanitized `req.query.studentId` with type check in `getPayment` (`paymentController.js`) to prevent NoSQL injection. Commit: `abb7370`.

---

# Current Authentication Architecture

- **`authenticate` middleware**: Applied globally in `index.js`. It parses the `Authorization: Bearer <token>` header, verifies the JWT, and attaches the decoded payload to `req.user`. If the token is missing or invalid, it sets `req.user = null` (soft-mode/compatibility mode).
- **`requireAuth` middleware**: A route-level guard that checks if `req.user` exists. If null, it rejects the request with a `401 Unauthorized`.
- **`requireAdmin` middleware**: A route-level guard (chained after `requireAuth`) that checks if `req.user.role === "admin"`. If not, it rejects with a `403 Forbidden`.
- **JWT flow**: Upon successful login, the backend signs a JWT containing the user's `id` and `role` (from the DB). The client is expected to store this token and attach it to the `Authorization` header of all subsequent API requests.
- **Route protection strategy**: Public routes omit the `requireAuth`/`requireAdmin` middlewares. Protected routes chain them sequentially within the Express router definitions.

---

# Route Protection Matrix

| Route | Method | Protection Level |
|---|---|---|
| `/admin/login` | POST | Public |
| `/admin/` | POST | Auth + Admin |
| `/admin/all` | GET | Auth + Admin |
| `/student/login` | POST | Public |
| `/student/` | POST | Auth + Admin |
| `/student/` | GET | Auth + Admin |
| `/student/scan` | GET | Auth + Admin |
| `/student/getOne/:id` | GET | Auth + Admin |
| `/student/:id` | GET | Auth |
| `/student/:id` | PUT | Auth + Admin |
| `/student/:id` | DELETE | Auth + Admin |
| `/addcourse/` | GET | Public |
| `/addcourse/` | POST | Auth + Admin |
| `/pricing/` | GET | Auth |
| `/pricing/create` | POST | Auth + Admin |
| `/payment/create` | POST | Auth + Admin |
| `/payment/` | GET | Auth + Admin |
| `/dashboard/` | GET | Auth + Admin |

---

# Security Audit Findings

### ~~SEC-001~~ ✅ FIXED (commit `1f770b7`)
- **Resolution**: Removed `"crypto": "^1.0.1"` from `package.json`. `addCourseController.js` resolves to Node.js built-in.

### ~~SEC-002~~ ✅ FIXED (commit `55772aa`)
- **Resolution**: Added ownership check in `getStudentById`: `if (req.user.role !== 'admin' && req.user.id !== req.params.id)` returns 403.

### ~~SEC-003~~ ✅ FIXED (commit `abb7370`)
- **Resolution**: Replaced `const { studentId } = req.query` with `typeof req.query.studentId === 'string'` type check in `getPayment`.

### SEC-004
- **Severity**: Medium
- **Description**: Insecure custom CORS configuration.
- **Evidence**: `index.js` line 33 hardcodes `res.setHeader("Access-Control-Allow-Origin", "*");`.
- **Risk**: Any external website can make cross-origin requests to this API, potentially leading to unauthorized actions if the user is authenticated.
- **Recommended Fix**: Remove the custom CORS middleware and use the standard `cors` package with a specific whitelist of allowed frontend domains.

### SEC-005
- **Severity**: Medium
- **Description**: Information disclosure via the global error handler.
- **Evidence**: `index.js` lines 74-79 return `err.message` directly in 500 responses.
- **Risk**: Unhandled exceptions can leak database stack traces, file paths, or specific syntax details to attackers, aiding in reconnaissance.
- **Recommended Fix**: Mask `err.message` in production environments, returning a generic "Internal Server Error" instead, while logging the true error internally.

### SEC-006
- **Severity**: Informational
- **Description**: Unnecessary unique constraint on the hashed password field.
- **Evidence**: `adminModel.js` line 20 defines `unique: true` for the `password` field.
- **Risk**: Conceptually incorrect. While bcrypt hashes are naturally unique due to salting, adding a DB constraint creates unnecessary index overhead and provides zero security benefit.
- **Recommended Fix**: Remove `unique: true` from the `password` field in `adminModel.js`.

---

# Findings Verification Status

| Finding | Status | Justification |
|---|---|---|
| **SEC-001** | ✅ Fixed | Removed from `package.json`. Commit `1f770b7`. |
| **SEC-002** | ✅ Fixed | Ownership check added in `getStudentById`. Commit `55772aa`. |
| **SEC-003** | ✅ Fixed | Type-safe string cast applied in `getPayment`. Commit `abb7370`. |
| **SEC-004** | Open | `index.js` explicitly defines the wildcard origin header. |
| **SEC-005** | Open | The error handler explicitly maps `err.message` to the JSON response body. |
| **SEC-006** | Open | `adminModel.js` schema explicitly defines the `unique` constraint on the password. |

---

# Frontend Compatibility Status

- **Current frontend authentication state**: Completely non-existent. The `Login.jsx` component bypasses the API entirely, does not fetch a JWT, does not store a JWT, and redirects the user blindly.
- **Why frontend currently breaks**: All backend routes (except login) now strictly demand a valid JWT in the `Authorization: Bearer <token>` header. Since the frontend does not send this header, all API calls instantly return `401 Unauthorized`.
- **Required frontend work**: 
  1. Uncomment the actual `axios.post` login call.
  2. Capture the `token` from the backend response and store it securely (e.g., `localStorage`).
  3. Create an Axios interceptor to automatically attach `Authorization: Bearer <token>` to every outbound request.
  4. Implement React Router route guards to redirect unauthenticated users to the `/login` screen.

> **DO NOT IMPLEMENT THE FRONTEND. ONLY DOCUMENT IT.**

---

# Recommended Fix Order

1. **SEC-001** (Supply Chain Risk: Remove `crypto` dependency)
2. **SEC-002** (IDOR: Validate ownership in `getStudentById`)
3. **SEC-003** (NoSQL Injection: Cast `studentId` to string in `getPayment`)
4. **SEC-004** (CORS: Restrict `Access-Control-Allow-Origin`)
5. **SEC-005** (Error Leakage: Sanitize 500 error responses)
6. **SEC-006** (Schema Cleanup: Remove unique password constraint)

---

# Future Session Instructions

1. **Read `SECURITY_AUDIT_HANDOFF.md` first.** This document contains the single source of truth for the project's security state.
2. **Do not re-audit completed work.** Assume the findings and architecture outlined here are accurate and up-to-date.
3. **Verify findings before modifying code.** Ensure the vulnerability still exists in the target file before applying a patch.
4. **Keep frontend and backend changes separate.** Do not mix backend security patches with frontend auth implementations in the same PR/commit.
5. **Update this file whenever a finding is fixed.** Remove or strike-through the finding, and move it to the "Completed Security Work" section.
