# STUDENT REGISTRATION & PRICING INTEGRATION AUDIT

## 1. Institute Dropdown Analysis
- **Data Source**: Hardcoded inline HTML elements.
- **Backend API**: None. It does not fetch data from the backend.
- **Endpoint expected**: `GET /pricing/institutes`
- **Controller expected**: `getInstitutes` in `pricingController.js`
- **Response fields expected**: An array of strings representing unique institutes.

## 2. Batch Dropdown Analysis
- **Data Source**: Hardcoded inline HTML elements.
- **Filtered by Institute?**: No. It is completely static.
- **Loaded Dynamically?**: No.
- **Updates on Institute Selection?**: No. Changing the institute does not change the batch options.

## 3. Data Flow Trace
**Expected Flow:**
Pricing MongoDB → Backend Controller (`getInstitutes`, `getBatchesByInstitute`) → API (`/pricing/institutes`, `/pricing/institutes/:institute/batches`) → Axios → `StudentRegister.jsx` State → Institute Dropdown → (onChange) → Axios fetch batches → Batch Dropdown

**Actual Flow:**
Static JSX `<option>` tags → `setInstitute` / `setBatch` state.
The connection to the Pricing database is completely broken/missing.

## 4. Verification Answers

- **Is this the intended architecture?**
  No. The options should be dynamically populated from the `Pricing` collection so administrators don't have to manually edit the frontend code every time a new batch or institute is added.
- **Is any API missing?**
  No. The backend API is complete. `getInstitutes` and `getBatchesByInstitute` are already implemented in `pricingController.js` and exposed in `pricingRouter.js`.
- **Is any frontend mapping incorrect?**
  Yes. The entire frontend mapping is missing. The component does not use `useEffect` to fetch institutes on mount, nor does it fetch batches when the institute changes.
- **Are field names mismatched?**
  N/A, because data fetching is missing. However, the state variables `institute` and `batch` are correctly named to match the backend `POST /student/` expectations.
- **Is filtering logic missing?**
  Yes. There is no logic to filter or fetch batches based on the selected institute.
- **Is the implementation complete?**
  No. It relies on placeholders.

## 5. Issues Identified

### Issue 1: Hardcoded Institute Options
- **File**: `StudentRegister.jsx`
- **Severity**: High
- **Root cause**: The developer used hardcoded `<option>` elements for a quick UI mock-up and never connected them to the API.
- **Why it happens**: No `useEffect` is present to call the `/pricing/institutes` endpoint on component mount.
- **Recommended action**: 
  1. Add a `useEffect` hook to fetch `GET /pricing/institutes` on mount.
  2. Store the result in an `institutes` state array.
  3. Map over the array to generate the `<option>` elements dynamically.

### Issue 2: Hardcoded and Static Batch Options
- **File**: `StudentRegister.jsx`
- **Severity**: High
- **Root cause**: Like the Institute dropdown, Batch options are hardcoded. Furthermore, the cascading dependency between Institute and Batch was never implemented.
- **Why it happens**: There is no `useEffect` or `onChange` handler to fetch the corresponding batches when an institute is selected.
- **Recommended action**:
  1. Add a `useEffect` hook that listens to the `institute` state variable.
  2. When `institute` changes (and is not empty), call `GET /pricing/institutes/${institute}/batches`.
  3. Store the result in a `batches` state array.
  4. Map over the array to generate the Batch `<option>` elements dynamically.
  5. Reset the `batch` state variable when the `institute` changes to prevent mismatched data.
