import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BacklogManagerPage from './pages/BacklogManagerPage';
import SprintPlannerPage from './pages/SprintPlannerPage';
import PerformancePage from './pages/PerformancePage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </Router>
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
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
            {/* ✅ Login route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Redirect root to login by default */}
        <Route path="*" element={<LoginPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
