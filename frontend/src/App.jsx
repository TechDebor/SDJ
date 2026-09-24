import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import CreateSuperAdmin from './pages/CreateSuperAdmin';
import MainLayout from './components/layout/MainLayout';
import { useAuth } from './context/AuthContext';

// Dashboards
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';

// Shared modules
import TaskKanban from './pages/shared/TaskKanban';
import AttendanceLeave from './pages/shared/AttendanceLeave';
import PayrollView from './pages/shared/PayrollView';
import Announcements from './pages/shared/Announcements';
import Profile from './pages/shared/Profile';

// Super Admin modules
import MasterHub from './pages/superadmin/MasterHub';
import AdManager from './pages/superadmin/AdManager';
import WorkforceDirectory from './pages/superadmin/WorkforceDirectory';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return children;
};

const DashboardRouter = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'SUPER_ADMIN') return <SuperAdminDashboard />;
  if (user.role === 'ADMIN') return <AdminDashboard />;
  return <EmployeeDashboard />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/create-super-admin" element={<CreateSuperAdmin />} />

        {/* Protected Routes enclosed in Layout */}
        <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardRouter />} />
          <Route path="tasks" element={<TaskKanban />} />
          <Route path="attendance" element={<AttendanceLeave />} />
          <Route path="payroll" element={<PayrollView />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="profile" element={<Profile />} />

          {/* Super Admin specific routes */}
          <Route path="master-hub" element={<PrivateRoute allowedRoles={['SUPER_ADMIN']}><MasterHub /></PrivateRoute>} />
          <Route path="ad-manager" element={<PrivateRoute allowedRoles={['SUPER_ADMIN']}><AdManager /></PrivateRoute>} />
          <Route path="workforce" element={<PrivateRoute allowedRoles={['SUPER_ADMIN']}><WorkforceDirectory /></PrivateRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
