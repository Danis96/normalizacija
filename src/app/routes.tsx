import { createBrowserRouter, Navigate } from 'react-router';
import { Login } from './screens/Login';
import { Dashboard } from './screens/Dashboard';
import { EventsList } from './screens/EventsList';
import { Layout } from './components/Layout';
import { DailyTasks } from './screens/DailyTasks';
import { Spending } from './screens/Spending';
import { Library } from './screens/Library';
import { Cinema } from './screens/Cinema';
import { LanguageLearning } from './screens/LanguageLearning';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <Layout>{children}</Layout>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/events',
    element: (
      <ProtectedRoute>
        <EventsList />
      </ProtectedRoute>
    ),
  },
  {
    path: '/daily-tasks',
    element: (
      <ProtectedRoute>
        <DailyTasks />
      </ProtectedRoute>
    ),
  },
  {
    path: '/spending',
    element: (
      <ProtectedRoute>
        <Spending />
      </ProtectedRoute>
    ),
  },
  {
    path: '/library',
    element: (
      <ProtectedRoute>
        <Library />
      </ProtectedRoute>
    ),
  },
  {
    path: '/cinema',
    element: (
      <ProtectedRoute>
        <Cinema />
      </ProtectedRoute>
    ),
  },
  {
    path: '/language-learning',
    element: (
      <ProtectedRoute>
        <LanguageLearning />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
