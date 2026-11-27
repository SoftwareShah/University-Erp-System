import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Login from "./Signup/Login";
import Signup from "./Signup/Signup";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./Home page/Home";
import AdminDashboard      from "./Dashboard/AdminDashboard";
import InstructorDashboard from "./Dashboard/InstructorDashboard";
import StudentDashboard    from "./Dashboard/StudentDashboard";

// Admin pages
import ManageStudents    from "./Admin/ManageStudents";
import ManageInstructors from "./Admin/ManageInstructors";
import ManageCourses     from "./Admin/ManageCourses";
import PostTimetable     from "./Admin/PostTimetable";
import ManagePrograms   from "./Admin/ManagePrograms";
import StudentDirectory from "./Admin/StudentDirectory";
import StudentDetails   from "./Admin/StudentDetails";
import AdminAttendance  from "./Admin/AdminAttendance";

// Instructor pages
import MarkAttendance   from "./Instructor/MarkAttendance";
import UploadAssignment from "./Instructor/UploadAssignment";
import UploadMarks      from "./Instructor/UploadMarks";

// Student pages
import ViewAttendance from "./Student/ViewAttendance";
import ViewMarks      from "./Student/ViewMarks";
import ViewTimetable  from "./Student/ViewTimetable";
import ViewAssignments from "./Student/ViewAssignments";
import ViewCourses from "./Student/ViewCourses";
import Profile from "./Profile/Profile";

const dashboardPaths = ['/admin', '/instructor', '/student'];

const Layout = ({ children }) => {
  const { pathname } = useLocation();
  const isDashboard = dashboardPaths.some(p => pathname.startsWith(p));
  return (
    <>
      {!isDashboard && <Navbar />}
      <div style={{ paddingTop: isDashboard ? '0' : '67px' }}>
        {children}
      </div>
      {!isDashboard && <Footer />}
    </>
  );
};

const PR = ({ role, children }) => (
  <ProtectedRoute role={role}>{children}</ProtectedRoute>
);

const App = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Public */}
          <Route path="/"       element={<Home />} />
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Admin */}
          <Route path="/admin/dashboard"   element={<PR role="admin"><AdminDashboard /></PR>} />
          <Route path="/admin/students"    element={<PR role="admin"><ManageStudents /></PR>} />
          <Route path="/admin/student-directory" element={<PR role="admin"><StudentDirectory /></PR>} />
          <Route path="/admin/students/:id" element={<PR role="admin"><StudentDetails /></PR>} />
          <Route path="/admin/programs"    element={<PR role="admin"><ManagePrograms /></PR>} />
          <Route path="/admin/instructors" element={<PR role="admin"><ManageInstructors /></PR>} />
          <Route path="/admin/courses"     element={<PR role="admin"><ManageCourses /></PR>} />
          <Route path="/admin/timetable"   element={<PR role="admin"><PostTimetable /></PR>} />
          <Route path="/admin/attendance"  element={<PR role="admin"><AdminAttendance /></PR>} />
          <Route path="/admin/profile"     element={<PR role="admin"><Profile role="admin" /></PR>} />

          {/* Instructor */}
          <Route path="/instructor/dashboard"   element={<PR role="instructor"><InstructorDashboard /></PR>} />
          <Route path="/instructor/courses"     element={<PR role="instructor"><ViewCourses role="instructor" /></PR>} />
          <Route path="/instructor/timetable"   element={<PR role="instructor"><ViewTimetable role="instructor" /></PR>} />
          <Route path="/instructor/attendance"  element={<PR role="instructor"><MarkAttendance /></PR>} />
          <Route path="/instructor/assignments" element={<PR role="instructor"><UploadAssignment /></PR>} />
          <Route path="/instructor/marks"       element={<PR role="instructor"><UploadMarks /></PR>} />
          <Route path="/instructor/profile"     element={<PR role="instructor"><Profile role="instructor" /></PR>} />

          {/* Student */}
          <Route path="/student/dashboard"   element={<PR role="student"><StudentDashboard /></PR>} />
          <Route path="/student/courses"     element={<PR role="student"><ViewCourses /></PR>} />
          <Route path="/student/timetable"   element={<PR role="student"><ViewTimetable /></PR>} />
          <Route path="/student/attendance"  element={<PR role="student"><ViewAttendance /></PR>} />
          <Route path="/student/assignments" element={<PR role="student"><ViewAssignments /></PR>} />
          <Route path="/student/marks"       element={<PR role="student"><ViewMarks /></PR>} />
          <Route path="/student/profile"     element={<PR role="student"><Profile role="student" /></PR>} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
