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
import { LanguageLearningQuizWindow } from './screens/LanguageLearningQuizWindow';
import { useApp } from './context/AppContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthLoading } = useApp();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center retro-desktop">
        <p className="text-lg text-purple-700 font-semibold">Loading your account...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
}

function PublicRoute() {
  const { isAuthenticated, isAuthLoading } = useApp();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center retro-desktop">
        <p className="text-lg text-purple-700 font-semibold">Loading your account...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Login />;
}

function ProtectedFullscreenRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthLoading } = useApp();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center retro-desktop">
        <p className="text-lg text-purple-700 font-semibold">Loading your account...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicRoute />,
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
    path: '/language-learning/quiz',
    element: (
      <ProtectedFullscreenRoute>
        <LanguageLearningQuizWindow />
      </ProtectedFullscreenRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
