# Kerala Solar CRM + Project Lifecycle Management System

A production-grade, full-stack web application purpose-built for solar EPC (Engineering, Procurement, and Construction) companies operating in Kerala, India.

---

## 🌟 Core Product Purpose

The application delivers 100% real-time operational visibility:
> **"At any moment, management can open any customer or solar project and immediately know where it stands, what is completed, what is pending, who is responsible, what is overdue, and what needs to happen next."**

---

## 🏗️ Architectural Boundary: Separation from Accounts

- **CRM & Project Lifecycle**: Owns lead capture, site surveys, customer bookings, KYC & roof documents collection status tracking, loan status tracking, KSEB Soura portal workflow, 14-item technical installation checklist, PM Surya Ghar subsidy tracking, task accountability, and immutable audit logs.
- **External Accounts System Boundary**: Procurement, inventory, payroll, full accounting ledgers, and purchase orders belong strictly to the external Accounts software. The CRM presents summary project values and external reference links (`[Open in Accounts System →]`).

---

## ⚡ Firebase Backend Architecture

The application is built with **Firebase** as its exclusive backend architecture:

```
Next.js (React / TypeScript / Tailwind CSS / shadcn/ui)
   ↓
Firebase Authentication (Email/Password, Session Tokens, Password Resets)
   ↓
Cloud Firestore (Real-time NoSQL collections, Compound Indexing, Security Rules)
   ↓
Firebase Cloud Functions (Privileged operations: lead conversion, stage transitions, duty assignments)
```

- **Identity**: Firebase Auth UID is the single identity anchor, linked to `/users/{uid}` in Cloud Firestore.
- **Role-Based Access Control (RBAC)**: 8 operational roles (`ADMIN`, `MANAGEMENT`, `PROJECT_MANAGER`, `SALES_EXECUTIVE`, `SURVEY_TEAM`, `DOCUMENTATION_TEAM`, `KSEB_TEAM`, `INSTALLATION_TEAM`) enforced by Firestore Security Rules (`firestore.rules`).
- **Document Tracking**: CRM tracks collection status (`PENDING`, `COLLECTED`, `NOT_REQUIRED`) with zero document storage bloat.
- **Dynamic Overdue Engine**: Duties and tasks are dynamically flagged overdue whenever `dueDate < currentTime && status != COMPLETED && status != CANCELLED`.
- **My Work Dashboard (`/my-work`)**: Personal task & duty action center organized across **Overdue**, **Today**, **Upcoming**, and **Completed**.

---

## 🛠️ Local Development & Firebase Emulator Suite

### Option 1: Firebase Emulator Suite (Recommended for Firebase testing)
```bash
# 1. Start Firebase Emulators (Auth: 9099, Firestore: 8080, Functions: 5001, UI: 4000)
npm run emulators

# 2. Seed Firebase Auth & Firestore with 8 Kerala Solar roles & sample projects
npm run seed:firebase

# 3. Start Next.js App
npm run dev
```

### Option 2: Isolated Development Mock (Offline / Zero-Config)
Set in `.env.local`:
```env
NEXT_PUBLIC_USE_MOCK_DATA=true
```

---

## 🚀 Key Modules & Capabilities

1. **Management Dashboard (`/dashboard`)**:
   - Executive KPIs (Total Leads, Active Projects, Completed Projects, Overdue Follow-ups, Projects at Risk/Delayed).
   - **"Needs Attention" Panel**: High-priority overdue duties, stuck projects, and missing documents with 1-click jump.

2. **Personal Action Center (`/my-work`)**:
   - Dynamic aggregation of an employee's assigned Duties, Tasks, Follow-ups, and Project Next Actions.
   - Categorized by **🔴 Overdue**, **🟠 Today**, **🔵 Upcoming**, and **🟢 Completed**.

3. **Lead Management (`/leads`)**:
   - Data Table and Kanban Pipeline board view.
   - Filtering by Sales Rep, Kerala District (14 districts), Source, Priority, and Stage.
   - **1-Click Conversion**: Atomic Cloud Function `convertLead` creating Customer + Project + Initial Document Duty.

4. **Solar Projects Pipeline (`/projects`)**:
   - 10-stage lifecycle with real-time multi-criteria filtering across Stage, Health, District, and Search.

5. **Project Master Detail (`/projects/[id]`)**:
   - **Prominent Next Action Card**: Title, Owner, Due Date, Overdue Indicator, and quick actions.
   - **10-Stage Visual Stepper**: Real-time progress with atomic Cloud Function validation.
   - **9 Modular Tabs**:
     - *Overview*: Specs (Waaree/Adani modules, Growatt/Sungrow inverters), External Accounts Link.
     - *Documents*: Pure collection status tracking (`COLLECTED`, `PENDING`, `NOT_REQUIRED`).
     - *Loan Tracker*: Bank/NBFC loan status tracking without balance sheet calculations.
     - *KSEB Soura Tracker*: Consumer #, Section Office, Soura Portal App #, Feasibility, Net Meter.
     - *Installation Tracker*: 14-item technical rigging checklist.
     - *PM Surya Ghar Subsidy*: National portal application #, inspection, and DBT credit status.
     - *Tasks & Duties*: Granular accountability.
     - *Audit Timeline*: Immutable chronological audit trail.
     - *Notes*: Timestamped internal team discussions.

6. **Team & Permissions Matrix (`/team` & `/profile`)**:
   - Employee directory with employee codes (`EMP-001` through `EMP-008`), designations, and status toggles.
   - Authenticated profile showing active role capabilities.

---

## ⚡ Quick Start

```bash
# Install dependencies
npm install

# Run TypeScript type check
npm run type-check

# Run Next.js development server
npm run dev

# Build production bundle
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
