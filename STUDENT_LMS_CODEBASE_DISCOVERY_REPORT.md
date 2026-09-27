# Student LMS — Codebase Discovery Report

Branch: `anupaVideo` (Status assumed based on instructions, Git commands yielded permission block)
Backend: `Combined_Mathematics_Backend`
Frontend: Not accessible (Workspace boundary restrictions)
Commit: Unknown
Generated date: 2026-08-21

## Executive Summary
This report provides a comprehensive discovery audit of the `Combined_Mathematics_Backend` repository to determine the feasibility of building a Student LMS / Video Access feature. The existing architecture possesses basic robust foundations for Auth and CRUD operations. However, the data models for Students, Payments, and Courses are currently decoupled in ways that will block LMS requirements. The payment system does not track the `institute`, the student model only supports a singular `batch`, and the existing `Course` module is entirely unrelated to institutes, batches, or teacher video uploads. Substantial new models and refactoring will be required.

## Critical Findings
- **Course System Exists but is Disconnected**: The `coursesModel.js` system exposes basic CRUD for courses (`/addcourse/`), but it has no relationship to `Student`, `Institute`, or `Batch`. It serves as a standalone list of URL links.
- **Teacher Videos**: There is absolutely no specialized "Teacher Video Upload" logic implemented.
- **Payment Structure**: Payments successfully track `studentId`, `batch`, and `month`, but **do not** track `institute`.
- **Payment / Access Verification**: There is currently NO logic that answers "Has Student X paid for Institute Y + Batch Z for the current month?". Payment/access determination is **NOT CURRENTLY IMPLEMENTED**.

## Backend Architecture
- **Entry point(s)**: `index.js`
- **Express setup**: Express 5.x, configures CORS, JSON parsing, with `pinoHttp` for logging.
- **Middleware**: `authMiddleware.js` containing `authenticate`, `requireAuth`, `requireAdmin`, `requireRole`.
- **Database Connection**: Mongoose to MongoDB (`process.env.MONGODB_URI`).
- **Data Flow Model**:
  ```
  Request -> pinoHttp (Logging) -> authenticate (JWT parsing) -> Role Verification -> Controller -> Mongoose Model -> MongoDB
  ```

## Student Data Model
The student model is stored in `model/studentModel.js`.
- **Identity**: `studentId` (String, unique), `email`, `phone`, `password` (bcrypt hashed).
- **Institute & Batch**: `institute` is an array of strings (`[String]`), but `batch` is a single string (`String`). 
  - *Conflict*: If a student must belong to multiple batches simultaneously (as the LMS requirements specify), this single `batch` string will be a blocking structural flaw.
- **Status Fields**: `isActive: Boolean` (default: true), `paymentType: String` (default: "Full Payment").
- **Flow**: `Registration -> /student/ -> createStudent Controller -> Hash Password -> MongoDB -> Upload QR to Supabase`.

## Payment System
- **Model**: `paymentModel.js`. Tracks `studentId`, `batch`, `month`, `amount`, `status`, `cardType`. 
- **Unique Constraints**: Uses a compound unique index on `{ studentId: 1, batch: 1, month: 1 }`.
- **Institute Association**: **NOT CURRENTLY IMPLEMENTED**. Payments are not linked to an institute.
- **Month Logic**: Stored as a simple string `"YYYY-MM"`.
- **Paid / Unpaid Calculation**: Not implemented dynamically. Only a static history (`GET /payment/`) is possible.

## Video / Course System
- **No Teacher Uploads**: "Teacher video upload functionality is not currently implemented."
- **Existing Model**: `coursesModel.js` handles `courseName`, `courseCategory`, `courseDescription`, `coursePrice`, and `courseUrl`. 
- **Missing Association**: Course URLs are completely unassociated with Institutes, Batches, or Categories relevant to the LMS. 

## Frontend Architecture
*(Could not directly audit due to workspace directory limits, but based on reading backend documentation created by prior developers: Vite + React Router v7 + Tailwind CSS).*
- **Safest Place for LMS**: `StudentDashboard.jsx` equivalent, guarded strictly by `ProtectedRoute` matching the JWT `role === "student"`.

## API Inventory
| Method | Endpoint | Auth | Role | Purpose | Relevant to LMS? |
|--------|----------|------|------|---------|------------------|
| POST | `/student/login` | None | Public | Student Auth | Yes (Login) |
| GET | `/student/getOne/:id` | Protected | Admin | Fetch Student | Yes (Identity) |
| GET | `/student/:id` | Protected | Owner | Fetch Profile | Yes (Identity) |
| POST | `/payment/create`| Protected | Admin | Record Payment | Yes (Triggers access) |
| GET | `/payment/` | Protected | Admin | Fetch Student Payments | Yes (Verify access) |
| GET | `/pricing/` | Protected | Auth | Fetch Pricing Modules | Yes (Batch/Inst logic) |
| POST | `/addcourse/` | Protected | Admin | Create Course link | No (Do not reuse) |

## Database Relationships
```
Student
 ├── institute (Array of Strings)
 ├── batch (String - Singular!)
 └── payments (Indirect by StudentID)

Payment
 ├── studentId
 ├── batch
 ├── month
 └── (No Institute Field)

Pricing
 ├── institute
 └── batch

Course (Existing Video implementation)
 └── (Isolated completely from Student/Institute/Batch)
```

## Security
- **Authentication**: Solid JWT processing (`authMiddleware.js`).
- **Authorization**: `requireAdmin` prevents students from accessing mutation APIs correctly.
- **IDOR**: Correctly prevented on `/student/:id` (Students cannot view other student profiles).

## Recent Developer Changes
Based on the `FINAL_TECHNICAL_AUDIT_REPORT.md` and `PRICING_AND_COURSE_AUDIT_REPORT.md` available in the root, it appears a previous developer investigated both the Pricing and Course modules. Their finding corroborates that the `Course` module is a broken, public-facing static mock and the `Pricing` UI is disconnected. The `QR Code` generation module was also identified as a failure point. 

## Duplication / Conflict Analysis
**CRITICAL**: Do **NOT** use the existing "Course Module" (`/addcourse`) for the LMS. It is a functionally distinct marketing or promotional feature that does not map to Institutes or Batches. You must create an entirely new module for LMS Teacher Video Uploads to avoid breaking/corrupting the current public-facing Courses.

## LMS Requirement Mapping

| Requirement | Existing Support | Missing | Relevant Files |
|-------------|------------------|---------|----------------|
| Student institute/batch access | Partial (Only one batch per student supported) | Missing (Multiple batches per student unsupported) | `model/studentModel.js` |
| Payment verification | Partial (Records exist) | Missing (No Institute tracking / No dynamic logic) | `model/paymentModel.js`, `paymentController.js` |
| Teacher video storage | Missing | Missing | N/A |
| Student LMS page | Missing | Missing | N/A |
| Backend video authorization | Missing | Missing | N/A |

## Relevant Files
**BACKEND FILES RELEVANT TO LMS:**
- `model/studentModel.js`: Requires structural refactoring if students must have multiple batches.
- `model/paymentModel.js`: Requires adding `institute` or changing the uniqueness constraint.
- `controller/paymentController.js`: Best place to inject the boolean verification logic for LMS access.
- `middleware/authMiddleware.js`: Will be reused to protect LMS endpoints.

## Recommended Future Implementation Order
1. **Refactor Core Data Models**: Modify `studentModel.js` to structure `{institute, batch}` properly so a single student can have multiple. Add `institute` to `paymentModel.js`.
2. **Implement LMS Access Logic**: Build an endpoint (e.g., `GET /student/access/:batch`) that checks if the student is active AND has an active payment for the current month.
3. **Build the Video Module**: Create a new `lessonModel.js` or `videoModel.js` linking URL, Institute, Batch, and Teacher. DO NOT reuse `Course`.
4. **Connect Frontend**: Build the LMS Viewer inside the Student UI, fetching videos only through the new authorized endpoint.
