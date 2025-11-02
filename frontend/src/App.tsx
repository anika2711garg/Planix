import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import BacklogManagerPage from './pages/BacklogManagerPage';
import SprintPlannerPage from './pages/SprintPlannerPage';
import PerformancePage from './pages/PerformancePage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import RoleBasedUserManagement from './pages/RoleBasedUserManagement';
import TeamsPage from './pages/TeamsPage';
import TeamManagementPage from './pages/TeamManagementPage';
import NotificationsPage from './pages/NotificationsPage';
import APITestPage from './pages/APITestPage';
import IntegrationTestPage from './pages/IntegrationTestPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/*" element={<ProtectedRoute><MainLayout /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/backlog" element={<BacklogManagerPage />} />
          <Route path="/sprint-planner" element={<SprintPlannerPage />} />
          <Route path="/performance" element={<PerformancePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          
          <Route path="/users" element={<RoleBasedUserManagement />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/team-management" element={<TeamManagementPage />} />
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
