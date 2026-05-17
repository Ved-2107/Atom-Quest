# 🚀 GoalFlow — Enterprise Goal Setting & Tracking Portal
### Hackathon Prototype | MERN Stack | AtomQuest 1.0

---

## 🎭 Demo Accounts (All password: `password123`)

| Role | Email | Access |
|------|-------|--------|
| **Admin / HR** | `admin@demo.com` | Full org analytics, audit, cycles, escalations |
| **Manager L1** | `manager@demo.com` | Team dashboard, approvals, check-in review |
| **Employee** | `employee@demo.com` | Goal sheet, quarterly updates, history |

> **💡 Tip:** Use the **Role Switcher** in the sidebar to demo all 3 roles without logging out.

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas (free tier works)
- npm

### 1. Install

```bash
# Backend
cd backend && npm install

# Frontend  
cd ../frontend && npm install
```

### 2. Configure Backend

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — set your MONGODB_URI
```

### 3. Seed Demo Data

```bash
cd backend && npm run seed
```

### 4. Start

```bash
# Terminal 1
cd backend && npm run dev     # → http://localhost:5000

# Terminal 2
cd frontend && npm run dev    # → http://localhost:5173
```

---

## 📁 Project Structure

```
goal-tracker/
├── backend/
│   ├── server.js
│   └── src/
│       ├── models/         User, Goal, Cycle, SharedGoal, AuditLog, Notification, Department
│       ├── routes/         auth, goals, users, checkIns, analytics, audit, cycles, notifications, sharedGoals
│       ├── middleware/     auth (JWT + RBAC), audit (change tracking)
│       └── utils/seed.js   Demo data seeder
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── auth/       LandingPage, LoginPage
        │   ├── employee/   Dashboard, GoalSheet, QuarterlyUpdates, GoalHistory
        │   ├── manager/    Dashboard, ApprovalsQueue, CheckInReview, TeamView
        │   └── admin/      Dashboard, Reports, AuditLogs, CycleManagement,
        │                   CompletionDashboard, EscalationModule,
        │                   ManagerEffectiveness, IntegrationsPage
        ├── components/
        │   ├── layout/     AppLayout (Sidebar + Navbar)
        │   └── shared/     KpiCard, StatusBadge, ProgressBar, SkeletonLoader,
        │                   CheckInScheduleBanner, RoleSwitcher, NotificationPanel
        ├── store/          Zustand (auth, goals, notifications, UI)
        └── utils/          api.js (axios), helpers.js (formatters, calculators)
```

---

## ✅ BRD Coverage Checklist

### Core Features (§2)
- [x] Goal creation with Thrust Area, Title, UoM Type, Target, Weightage, Deadline
- [x] **UoM Types (BRD §2.2)**:
  - Min (Higher is Better) → Achievement ÷ Target × 100
  - Max (Lower is Better) → Target ÷ Achievement × 100
  - Zero (Zero = Success) → Achievement=0 means 100%
  - Timeline (Date-based) → Elapsed ÷ Total Duration × 100
- [x] **Validation Rules (BRD §2.1)**: Total weightage = 100%, min 10% per goal, max 8 goals

### Approval Workflow (§3)
- [x] Draft → Submitted → Approved / Rejected / Rework
- [x] Manager inline edit (target, weightage) before approving
- [x] Goal locked after approval (unlock by admin only)
- [x] Manager comments on approve/reject

### Check-in Schedule (§2.3)
- [x] Phase 1 Goal Setting: May | Q1: July | Q2: October | Q3: January | Q4: March/April
- [x] Live schedule banner shown on all pages
- [x] Quarter-specific check-in forms with status tracking
- [x] Manager feedback per quarter

### Reporting (§4)
- [x] Planned vs Actual report (Achievement Report)
- [x] Completion Dashboard — who has/hasn't done check-ins (real-time heatmap)
- [x] Quarter-on-Quarter (QoQ) trend charts
- [x] Department analytics
- [x] CSV export
- [x] Excel export (.xls)
- [x] Audit Trail with before/after diffs

### Good-to-Have (§5)
- [x] **Microsoft Entra ID / Azure AD** — SSO mock with connect/disconnect UI (§5.1)
- [x] **Microsoft Teams Bot** — Adaptive card previews with deep-link (§5.2)
- [x] **Email Notification Center** — configurable triggers, send queue (§5.2)
- [x] **Escalation Engine** — 3 rule types, severity levels, notify button (§5.3)
- [x] **Manager Effectiveness Dashboard** — radar chart, QoQ trends, scorecard (§5.4)
- [x] **AI Insights Panel** — 6 smart alerts with pattern detection (Admin)
- [x] **Shared/Department Goals** — assigned goals with read-only title/target

---

## 🎯 BRD-Aligned UoM Calculation (§2.2)

| UoM Type | Direction | Formula | Example |
|----------|-----------|---------|---------|
| **Min** | Higher is Better ↑ | Achievement ÷ Target × 100 | Sales Revenue, NPS |
| **Max** | Lower is Better ↓ | Target ÷ Achievement × 100 | TAT, Cost, Response Time |
| **Zero** | Zero = Success ○ | 0 → 100%, else 0% | Incidents, Defects |
| **Timeline** | Date-based 📅 | Elapsed ÷ Total Duration × 100 | Project Delivery |

---

## 🔐 Role-Based Access Control

| Feature | Employee | Manager | Admin |
|---------|----------|---------|-------|
| Create/Edit own goals | ✅ | ✅ | ✅ |
| Submit goals | ✅ | — | — |
| Approve/Reject goals | — | ✅ | ✅ |
| Unlock goals | — | — | ✅ |
| View team goals | — | ✅ | ✅ |
| Org analytics | — | Partial | ✅ |
| Audit logs | — | — | ✅ |
| Cycle management | — | — | ✅ |
| Escalation engine | — | — | ✅ |
| Manager effectiveness | — | — | ✅ |
| Integrations config | — | — | ✅ |

---

## 🌐 API Reference

### Auth
```
POST /api/auth/login          Login → JWT token
GET  /api/auth/me             Current user profile
POST /api/auth/register       Register new user
```

### Goals (BRD §2)
```
GET    /api/goals             List goals (role-filtered)
POST   /api/goals             Create goal (validates weightage rules)
POST   /api/goals/submit      Submit goal sheet (validates 100% total)
PUT    /api/goals/:id         Update goal
DELETE /api/goals/:id         Delete draft goal
POST   /api/goals/:id/approve Approve + lock goal
POST   /api/goals/:id/reject  Reject or return for rework
PUT    /api/goals/:id/checkin Add/update quarterly check-in
POST   /api/goals/:id/unlock  Admin unlock locked goal
```

### Analytics
```
GET /api/analytics/overview     Org analytics (admin)
GET /api/analytics/employee/me  Personal analytics
GET /api/analytics/manager      Team analytics
GET /api/analytics/completion   Completion dashboard data (BRD §4)
GET /api/analytics/escalations  Escalation rule engine (BRD §5.3)
```

### Other
```
GET /api/cycles               List all cycles
GET /api/cycles/active        Get active cycle
POST /api/cycles              Create cycle (admin)
GET /api/audit                Audit logs (paginated)
GET /api/notifications        User notifications
PUT /api/notifications/:id/read      Mark read
PUT /api/notifications/mark-all-read Mark all read
GET /api/check-ins            Check-in overview
POST /api/check-ins/:id/feedback     Manager feedback
GET /api/users                List users
GET /api/users/team           Manager's team
GET /api/shared-goals         Shared department goals
```

---

## 🚀 Deployment

### Frontend → Vercel
1. Import `frontend/` folder to Vercel
2. Set env: `VITE_API_URL=https://your-backend.onrender.com/api`
3. Build: `npm run build` | Output: `dist`

### Backend → Render
1. Connect GitHub, set Root Directory: `backend`
2. Build: `npm install` | Start: `node server.js`
3. Add all env vars from `.env.example`

### Database → MongoDB Atlas
1. Create free M0 cluster
2. Add user + whitelist `0.0.0.0/0`
3. Copy connection string to `MONGODB_URI`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| State | Zustand with persistence |
| Charts | Recharts (Area, Bar, Line, Pie, Radar) |
| Forms | React Hook Form + Zod validation |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose ODM |
| Auth | JWT + bcrypt, RBAC middleware |
| Export | CSV + Excel (.xls) |

---

*Built for AtomQuest Hackathon 1.0 — GoalFlow Enterprise Performance Portal*
#   A t o m - Q u e s t  
 