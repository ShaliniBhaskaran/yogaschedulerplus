import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InstructorDashboardPage from './pages/InstructorDashboardPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute role="manager">
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor"
        element={
          <ProtectedRoute role="instructor">
            <InstructorDashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
