import { Link } from 'react-router-dom';

const features = [
  { icon: '🎓', title: 'Student Portal',    desc: 'View attendance, marks, timetable and course assignments in one place.' },
  { icon: '👨🏫', title: 'Faculty Portal',   desc: 'Mark attendance period-wise, publish assignments and manage student marks.' },
  { icon: '👑', title: 'Admin Control',     desc: 'Full control over students, instructors, courses, timetable and reports.' },
  { icon: '📊', title: 'Live Reports',      desc: 'Real-time analytics on attendance, performance and academic progress.' },
  { icon: '🗓️', title: 'Smart Timetable',  desc: 'Admin posts timetable, instructors and students see their own schedule.' },
  { icon: '🔒', title: 'Secure Access',     desc: 'Role-based login ensures every user sees only what they are allowed to.' },
];

const Home = () => {
  return (
    <div className="home-wrapper">

      {/* ── Hero Section ── */}
      <section className="home-hero">
        <div className="home-hero-bg" />
        <div className="home-hero-content">
          <div className="home-hero-tag">Dev Bhoomi Uttarakhand University</div>
          <h1 className="home-hero-heading">
            One Platform for<br />
            <span className="home-hero-accent">Smarter Education</span>
          </h1>
          <p className="home-hero-para">
            A unified ERP system for students, faculty and administration to manage
            academics, attendance, courses, timetable and more — all in one place.
          </p>
          <div className="home-hero-btns">
            <Link to="/login"  className="home-btn-primary">Login to Portal</Link>
            <Link to="/signup" className="home-btn-outline">Create Account</Link>
          </div>
        </div>
        <div className="home-hero-img-wrap">
          <img src="/Assets/logo.jpg" alt="DBUU" className="home-hero-logo" />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="home-features">
        <div className="home-section-tag">What We Offer</div>
        <h2 className="home-section-heading">Everything You Need in One System</h2>
        <p className="home-section-sub">
          Designed specifically for Dev Bhoomi Uttarakhand University to streamline
          academic operations for all stakeholders.
        </p>
        <div className="home-features-grid">
          {features.map((f) => (
            <div className="home-feature-card" key={f.title}>
              <div className="home-feature-icon">{f.icon}</div>
              <h5 className="home-feature-title">{f.title}</h5>
              <p className="home-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="home-cta">
        <h2 className="home-cta-heading">Ready to Get Started?</h2>
        <p className="home-cta-sub">Access the DBUU ERP portal for your academic and administrative needs.</p>
        <div className="home-hero-btns">
          <Link to="/signup" className="home-btn-primary">Get Started</Link>
          <Link to="/login"  className="home-btn-outline-white" style={{color:"white", borderColor:"white"}}>Login</Link>
        </div>
      </section>

    </div>
  );
};

export default Home;
