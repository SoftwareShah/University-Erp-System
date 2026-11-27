import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { API_BASE } from "../utils/api";
import ProfileAvatar from "./ProfileAvatar";

const BASE = API_BASE;

const menus = {
  admin: [
    { label: "Dashboard",         icon: "🏠", path: "/admin/dashboard" },
    { label: "Manage Students",   icon: "🎓", path: "/admin/students" },
    { label: "Student Directory",icon: "🗂️", path: "/admin/student-directory" },
    { label: "Programs & Branches",icon:"🏛️", path: "/admin/programs" },
    { label: "Manage Instructors",icon: "👨🏫", path: "/admin/instructors" },
    { label: "Courses",           icon: "📚", path: "/admin/courses" },
    { label: "Timetable",         icon: "🗓️", path: "/admin/timetable" },
    { label: "Attendance",        icon: "✅", path: "/admin/attendance" },
    { label: "My Profile",        icon: "👤", path: "/admin/profile" },
  ],
  instructor: [
    { label: "Dashboard",      icon: "🏠", path: "/instructor/dashboard" },
    { label: "My Courses",     icon: "📚", path: "/instructor/courses" },
    { label: "Timetable",      icon: "🗓️", path: "/instructor/timetable" },
    { label: "Mark Attendance",icon: "✅", path: "/instructor/attendance" },
    { label: "Assignments",    icon: "📝", path: "/instructor/assignments" },
    { label: "Upload Marks",   icon: "📊", path: "/instructor/marks" },
    { label: "My Profile",    icon: "👤", path: "/instructor/profile" },
  ],
  student: [
    { label: "Dashboard",   icon: "🏠", path: "/student/dashboard" },
    { label: "My Courses",  icon: "📚", path: "/student/courses" },
    { label: "Timetable",   icon: "🗓️", path: "/student/timetable" },
    { label: "Attendance",  icon: "✅", path: "/student/attendance" },
    { label: "Assignments", icon: "📝", path: "/student/assignments" },
    { label: "My Marks",    icon: "📊", path: "/student/marks" },
    { label: "My Profile",  icon: "👤", path: "/student/profile" },
  ],
};

const roleColors = {
  admin:      { bg: "#1a3a1a", accent: "#e07b00", badge: "Administrator" },
  instructor: { bg: "#1a2a3a", accent: "#3b82f6", badge: "Instructor" },
  student:    { bg: "#1a1a3a", accent: "#8b5cf6", badge: "Student" },
};

const DashboardLayout = ({ children, role }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const colors = roleColors[role] || roleColors.student;
  const links  = menus[role] || [];

  const name   = localStorage.getItem("name")  || "User";
  const avatar = localStorage.getItem("avatar");
  const avatarSrc = avatar
    ? (avatar.startsWith("http") ? avatar : `${BASE}${avatar}`)
    : "";
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="db-wrapper">
      {/* ── Sidebar ── */}
      <aside
        className="db-sidebar"
        style={{ width: collapsed ? "64px" : "240px", background: colors.bg }}
      >
        {/* Logo */}
        <div className="db-sidebar-logo">
          <img src="/Assets/logo.jpg" alt="DBUU" className="db-logo-img" />
          {!collapsed && (
            <div className="db-logo-text">
              <span className="db-logo-name">DBUU</span>
              <span className="db-logo-sub" style={{ color: colors.accent }}>
                {colors.badge}
              </span>
            </div>
          )}
        </div>

        {/* User profile block in sidebar */}
        <div className="db-sidebar-user" style={{ padding: collapsed ? "12px 8px" : "12px 16px", borderBottom: `1px solid rgba(255,255,255,0.08)`, display: "flex", alignItems: "center", gap: "10px" }}>
          <ProfileAvatar src={avatarSrc} name={name} size={collapsed ? 36 : 44} style={{ border: `2px solid ${colors.accent}` }} />
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
              <div style={{ color: colors.accent, fontSize: "0.72rem" }}>{colors.badge}</div>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="db-nav">
          {links.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`db-nav-item ${pathname === item.path ? "active" : ""}`}
              style={{ "--accent": colors.accent }}
            >
              <span className="db-nav-icon">{item.icon}</span>
              {!collapsed && <span className="db-nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <button className="db-logout" onClick={handleLogout}>
          <span>🚪</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </aside>

      {/* ── Main Area ── */}
      <div className="db-main">
        {/* Top Header */}
        <header className="db-header">
          <button className="db-toggle" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? "▶" : "◀"}
          </button>
          <div className="db-header-title">
            {links.find((l) => l.path === pathname)?.label || "Dashboard"}
          </div>
          <div className="db-header-right">
            <span style={{ color: "#fff", fontWeight: 500, fontSize: "0.9rem" }}>
              Hello, <strong>{name}</strong>
            </span>
            <span className="db-badge" style={{ background: colors.accent }}>
              {colors.badge}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="db-content">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
