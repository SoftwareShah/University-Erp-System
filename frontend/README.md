# DBUU ERP System — Frontend

> **Dev Bhoomi Uttarakhand University** — Enterprise Resource Planning System  
> Built with **React + Vite**

---

## 🗂️ Project Structure at a Glance

```
frontend/
├── public/
│   └── Assets/          → university logo
├── src/
│   ├── main.jsx         → Entry point
│   ├── App.jsx          → Router + Layout wrapper
│   ├── index.css        → All global styles
│   ├── Navbar.jsx       → Top navigation bar
│   ├── Footer.jsx       → Bottom footer
│   │
│   ├── Home page/
│   │   └── Home.jsx     → Landing page (/)
│   │
│   ├── Signup/
│   │   ├── Signup.jsx   → Registration page (/signup)
│   │   └── Login.jsx    → Login page (/login)
│   │
│   ├── components/
│   │   ├── ProtectedRoute.jsx   → Guards dashboard routes
│   │   └── DashboardLayout.jsx  → Sidebar + header for dashboards
│   │
│   ├── Dashboard/
│   │   ├── AdminDashboard.jsx
│   │   ├── InstructorDashboard.jsx
│   │   └── StudentDashboard.jsx
│   │
│   ├── Admin/
│   │   ├── ManageStudents.jsx
│   │   ├── ManageInstructors.jsx
│   │   ├── ManageCourses.jsx
│   │   └── PostTimetable.jsx
│   │
│   ├── Instructor/
│   │   ├── MarkAttendance.jsx
│   │   ├── UploadAssignment.jsx
│   │   └── UploadMarks.jsx
│   │
│   └── Student/
│       ├── ViewAttendance.jsx
│       ├── ViewAssignments.jsx
│       ├── ViewCourses.jsx
│       ├── ViewMarks.jsx
│       └── ViewTimetable.jsx
```

---

## 🚀 How the App Starts — Entry Flow

```
index.html
    │
    └──▶  main.jsx
              │
              │  Creates the React root and renders the top-level component
              │
              └──▶  App.jsx
                        │
                        ├── Wraps everything in <BrowserRouter>
                        ├── Wraps everything in <Layout>
                        └── Defines all <Routes>
```

### `main.jsx`
This is the **very first file** React runs.  
It finds the `<div id="root">` in `index.html` and mounts the entire React app inside it.

```jsx
createRoot(document.getElementById('root')).render(<App />)
```

---

### `App.jsx`
This is the **brain of routing**. It does two things:

**1. Layout wrapper** — decides whether to show Navbar + Footer  
```
If URL starts with /admin, /instructor, /student  →  hide Navbar & Footer (dashboard mode)
Otherwise                                         →  show Navbar & Footer (public mode)
```

**2. Route definitions** — maps every URL to a component

```
/           →  Home.jsx          (landing page)
/login      →  Login.jsx
/signup     →  Signup.jsx
/admin/*    →  Admin pages       (protected, role = admin)
/instructor/*  →  Instructor pages  (protected, role = instructor)
/student/*  →  Student pages     (protected, role = student)
```

---

## 🔐 Authentication Flow

```
User visits /signup or /login
        │
        ▼
   Signup.jsx / Login.jsx
        │
        │  Sends POST request to backend API
        │  POST http://localhost:3000/api/auth/signup
        │  POST http://localhost:3000/api/auth/login
        │
        ▼
   Backend returns { token, user: { role, name } }
        │
        ▼
   Stored in localStorage:
        localStorage.setItem('token', ...)
        localStorage.setItem('role', ...)
        localStorage.setItem('name', ...)
        │
        ▼
   Redirect based on role:
        admin       →  /admin/dashboard
        instructor  →  /instructor/dashboard
        student     →  /student/dashboard
```

### Login credentials by role

| Role       | Login uses              |
|------------|-------------------------|
| Student    | ERP ID + Date of Birth  |
| Instructor | Employee ID + Date of Birth |
| Admin      | Email + Password (seed script only) |

Student profile information is read-only in the student portal. Administrators create and update student academic, personal, communication, and parent/guardian records from Student Management. Father and mother names are required; their contact details are optional.

> ⚠️ Admin account is created only via `backend/seed/createAdmin.js` — never from the frontend signup form.

---

## 🛡️ ProtectedRoute — How Route Guards Work

```
User tries to visit /admin/dashboard
        │
        ▼
   ProtectedRoute checks localStorage:
        ├── No token?        →  redirect to /login
        ├── Wrong role?      →  redirect to /login
        └── Token + correct role?  →  render the page ✅
```

Every dashboard route is wrapped like this in `App.jsx`:
```jsx
<Route path="/admin/dashboard" element={
  <ProtectedRoute role="admin">
    <AdminDashboard />
  </ProtectedRoute>
} />
```

---

## 🧭 Full Page Flow by Role

### 👤 Student Journey
```
/login   →  Login with administrator-issued ERP ID + DOB + CAPTCHA
        │
        ▼
/student/dashboard    →  Overview cards + quick links
/student/profile      →  View official student profile (read-only)
/student/courses      →  View courses in the student's branch
/student/assignments  →  View published course assignments
/student/attendance   →  View lecture-based attendance and attendance score
/student/marks        →  View marks + grades per subject
/student/timetable    →  Day-wise class schedule cards
```

### 👨‍🏫 Instructor Journey
```
/signup  →  Register with Employee ID + DOB + Name + Email + Mobile + Department
/login   →  Login with Employee ID + DOB + CAPTCHA
        │
        ▼
/instructor/dashboard    →  Overview stats + quick actions
/instructor/courses      →  View assigned courses
/instructor/timetable    →  View assigned timetable
/instructor/attendance   →  Record lecture-wise attendance
/instructor/assignments  →  Create, edit, and delete assignments
/instructor/marks        →  Create, update, and delete student marks
```

### 🛡️ Admin Journey
```
Admin account created via:  node backend/seed/createAdmin.js
/login  →  Login with Email + Password + CAPTCHA
        │
        ▼
/admin/dashboard     →  System overview stats
/admin/students      →  View / manage all students
/admin/students/:id  →  View student details
/admin/instructors   →  View / manage all instructors
/admin/courses       →  Create and manage courses
/admin/timetable     →  Post timetable for classes
```

---

## 🧩 Shared Components

### `DashboardLayout.jsx`
Used by **all 3 dashboards**. Provides:
- Collapsible left sidebar with role-specific nav links
- Top header bar with page title + role badge + logout button
- Color theme per role:
  - Admin → Green `#1a3a1a`
  - Instructor → Blue `#3b82f6`
  - Student → Purple `#8b5cf6`

```
DashboardLayout
    ├── Sidebar (collapsible)
    │     ├── Logo + University name
    │     ├── Nav links (role-specific)
    │     └── Logout button → clears localStorage → redirects to /login
    └── Main content area
          ├── Top header (page title + role badge)
          └── {children}  ← the actual page content goes here
```

### `Navbar.jsx`
Shown only on **public pages** (`/`, `/login`, `/signup`).  
Fixed at top, DBUU green gradient, links: Home · Signup · Login.

### `Footer.jsx`
Shown only on **public pages**.  
4-column layout: About · Quick Links · ERP Modules · Contact.

---

## 🎨 Styling

All styles live in one file: **`src/index.css`**

Organized in sections:
```
index.css
├── Global reset (box-sizing, body margin)
├── Navbar styles          (.erp-navbar, .erp-nav-link ...)
├── Footer styles          (.erp-footer, .footer-links ...)
├── Home page styles       (.home-hero, .home-stats, .home-features ...)
├── Signup page styles     (.signup-wrapper, .signup-left, .signup-form-box ...)
├── Login page styles      (.lp-root, .lp-card, .lp-tabs ...)
└── Dashboard styles       (.db-wrapper, .db-sidebar, .db-card, .db-table ...)
```

**Theme colors:**
| Usage       | Color              |
|-------------|--------------------|
| Primary green | `#1a3a1a` / `#2e5c2e` |
| Saffron accent | `#e07b00`         |
| Admin accent | `#1a3a1a`          |
| Instructor accent | `#3b82f6`     |
| Student accent | `#8b5cf6`        |

---

## Backend API endpoints consumed by the frontend

| Method | Endpoint                  | Used by              |
|--------|---------------------------|----------------------|
| POST   | `/api/auth/signup`        | Signup.jsx           |
| POST   | `/api/auth/login`         | Login.jsx            |
| GET | `/api/student/profile`   | Student read-only profile |
| GET/POST/PUT/DELETE | `/api/teacher/assignments` | Instructor assignment management |
| GET/POST/DELETE | `/api/teacher/marks` | Instructor marks management |
| GET/POST | `/api/teacher/attendance` | Instructor attendance |
| GET | `/api/student/attendance` | Student attendance |
| GET | `/api/student/assignments` | Student assignments |
| GET | `/api/student/marks` | Student marks |

All API calls include the JWT token in the header:
```js
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`
}
```

---

## ⚙️ How to Run

```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev

# App runs at:
http://localhost:5173
```

> Make sure the backend is running at `http://localhost:3000` before using the app.

---

## 🧠 Quick Mental Model for Beginners

```
Browser opens http://localhost:5173
        │
        ▼
index.html  loads  main.jsx
        │
        ▼
main.jsx  renders  App.jsx
        │
        ▼
App.jsx  checks the URL
        │
        ├── /            →  show Navbar + Home + Footer
        ├── /login       →  show Navbar + Login + Footer
        ├── /signup      →  show Navbar + Signup + Footer
        │
        └── /admin/*     →  ProtectedRoute checks token+role
        └── /instructor/*      if OK → DashboardLayout + Page
        └── /student/*         if NOT → redirect to /login
```

That's the entire flow. Every page is just a React component.  
The router decides which component to show based on the URL.  
The ProtectedRoute decides if you're allowed to see it.
