import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ProjectTools from './pages/ProjectTools';
import AddProject from './pages/AddProject';
import Tools from './pages/Tools';
import Materials from './pages/Materials';
import Approvals from './pages/Approvals';
import Tasks from './pages/Tasks';
import Attendance from './pages/Attendance';
import AttendanceLogs from './pages/AttendanceLogs';
import DailyReport from './pages/DailyReport';
import Profile from './pages/Profile';
import MyPayments from './pages/MyPayments';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<AppLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/project-tools/:id" element={<ProjectTools />} />
            <Route path="/add-project" element={<AddProject />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/attendance-logs" element={<AttendanceLogs />} />
            <Route path="/daily-report" element={<DailyReport />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-payments" element={<MyPayments />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
