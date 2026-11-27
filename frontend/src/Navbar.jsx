import { Link, useLocation, useNavigate } from "react-router-dom";

const Navbar = () => {
  const { pathname } = useLocation();
  const navigate     = useNavigate();

  // Role-based nav link targets
  const role = localStorage.getItem('role');

  const roleLinks = {
    student: {
      Attendance: '/student/attendance',
      Courses:    '/student/courses',
      Timetable:  '/student/timetable',
      Marks:      '/student/marks',
    },
    teacher: {
      Attendance: '/instructor/attendance',
      Courses:    '/instructor/courses',
      Timetable:  '/instructor/timetable',
      Marks:      '/instructor/marks',
    },
    instructor: {
      Attendance: '/instructor/attendance',
      Courses:    '/instructor/courses',
      Timetable:  '/instructor/timetable',
      Marks:      '/instructor/marks',
    },
    admin: {
      Attendance: '/admin/dashboard',
      Courses:    '/admin/courses',
      Timetable:  '/admin/timetable',
    },
  };

  // Get the correct link for a nav item based on current role
  const getLink = (item) => {
    if (role && roleLinks[role]) return roleLinks[role][item] || '/login';
    return '/login';
  };

  const handleNavClick = (e, item) => {
    e.preventDefault();
    if (!role) {
      navigate('/login');
    } else {
      navigate(getLink(item));
    }
  };

  const navItems = role === 'admin'
    ? ['Attendance', 'Courses', 'Timetable']
    : ['Attendance', 'Courses', 'Timetable', 'Marks'];

  return (
    <nav className="erp-navbar sticky-top">
      <div className="container-fluid px-4 d-flex align-items-center justify-content-between" style={{ height: '64px' }}>

        {/* Brand */}
        <Link to="/" className="erp-brand text-decoration-none d-flex align-items-center gap-3">
          <img src="/Assets/logo.jpg" alt="DBUU Logo" className="erp-logo-img" />
          <div className="erp-brand-text">
            <span className="erp-brand-title">DBUU</span>
            <span className="erp-brand-sub">ERP Management System</span>
          </div>
        </Link>

        {/* Mobile toggle */}
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" style={{ filter: 'invert(1)' }}></span>
        </button>

        {/* Nav Links */}
        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav align-items-center gap-1">

            <li className="nav-item">
              <Link className={`erp-nav-link ${pathname === '/' ? 'erp-nav-active' : ''}`} to="/">
                Home
              </Link>
            </li>

            {navItems.map((item) => (
              <li className="nav-item" key={item}>
                <a
                  href="#"
                  className="erp-nav-link"
                  onClick={(e) => handleNavClick(e, item)}
                >
                  {item}
                </a>
              </li>
            ))}

            <li className="nav-item ms-2">
              <Link
                className={`erp-btn-outline ${pathname === '/signup' ? 'active' : ''}`}
                to="/signup"
              >
                Signup
              </Link>
            </li>
            <li className="nav-item ms-1">
              <Link
                className={`erp-btn-solid ${pathname === '/login' ? 'active' : ''}`}
                to="/login"
              >
                Login
              </Link>
            </li>

          </ul>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
