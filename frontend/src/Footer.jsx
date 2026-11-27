import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="erp-footer">

      {/* Main footer content */}
      <div className="container-fluid px-5 py-5">
        <div className="row g-5">

          {/* Col 1 — Logo + About */}
          <div className="col-lg-4 col-md-6">
            <div className="d-flex align-items-center gap-3 mb-3">
              <img src="/Assets/logo.jpg" alt="DBUU" className="footer-logo" />
              <div>
                <div className="footer-uni-name">Dev Bhoomi Uttarakhand University</div>
                <div className="footer-uni-sub">Dehradun, Uttarakhand</div>
              </div>
            </div>
            <p className="footer-about">
              Committed to excellence in education, research and innovation.
              Empowering the next generation of leaders through a world-class
              academic environment.
            </p>
            <div className="d-flex gap-3 mt-3">
              <a href="#" className="footer-social">f</a>
              <a href="#" className="footer-social">in</a>
              <a href="#" className="footer-social">tw</a>
              <a href="#" className="footer-social">yt</a>
            </div>
          </div>

          {/* Col 2 — Quick Links */}
          <div className="col-lg-2 col-md-6">
            <h6 className="footer-heading">Quick Links</h6>
            <ul className="footer-links">
              <li><Link to="/login">Home</Link></li>
              <li><Link to="/login">About Us</Link></li>
              <li><Link to="/login">Courses</Link></li>
              <li><Link to="/login">Admissions</Link></li>
              <li><Link to="/login">Research</Link></li>
              <li><Link to="/login">Campus Life</Link></li>
            </ul>
          </div>

          {/* Col 3 — ERP Modules */}
          <div className="col-lg-2 col-md-6">
            <h6 className="footer-heading">ERP Modules</h6>
            <ul className="footer-links">
              <li><Link to="/login">Attendance</Link></li>
              <li><Link to="/login">Courses</Link></li>
              <li><Link to="/login">Assignments</Link></li>
              <li><Link to="/login">Timetable</Link></li>
              <li><Link to="/login">Fees</Link></li>
              <li><Link to="/login">Reporting</Link></li>
            </ul>
          </div>

          {/* Col 4 — Contact */}
          <div className="col-lg-4 col-md-6">
            <h6 className="footer-heading">Contact Us</h6>
            <ul className="footer-contact">
              <li>
                <span className="footer-contact-icon">📍</span>
                Manduwala, Dehradun, Uttarakhand — 248007
              </li>
              <li>
                <span className="footer-contact-icon">📞</span>
                +91 135 000 0000
              </li>
              <li>
                <span className="footer-contact-icon">✉️</span>
                info@dbu.edu.in
              </li>
              <li>
                <span className="footer-contact-icon">🌐</span>
                www.dbu.edu.in
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="container-fluid px-5 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span>© {new Date().getFullYear()} Dev Bhoomi Uttarakhand University. All rights reserved.</span>
          <div className="d-flex gap-3">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
            <a href="#">Sitemap</a>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
