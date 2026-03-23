import { useEffect } from 'react';
import { Toaster } from "@/components/ui/sonner";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { qbank } from '@/configs';

import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Study from './pages/Study';
import Analytics from './pages/Analytics';
import PracticeTests from './pages/PracticeTests';
import ExamSimulation from './pages/ExamSimulation';
import TestHistory from './pages/TestHistory';
import TestReview from './pages/TestReview';
import Upgrade from './pages/Upgrade';
import Settings from './pages/Settings';
import Chatbot from './pages/Chatbot';
import Layout from './Layout';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  if (isLoadingAuth) return <div className="fixed inset-0 flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return children;
}

function AppRoutes() {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  useEffect(() => { document.title = `${qbank.name} — ${qbank.tagline}`; }, []);

  if (isLoadingAuth) return <div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>;

  const pages = [
    { path: '/Dashboard', Component: Dashboard },
    { path: '/Study', Component: Study },
    { path: '/Analytics', Component: Analytics },
    { path: '/PracticeTests', Component: PracticeTests },
    { path: '/ExamSimulation', Component: ExamSimulation },
    { path: '/TestHistory', Component: TestHistory },
    { path: '/TestReview', Component: TestReview },
    { path: '/Upgrade', Component: Upgrade },
    { path: '/Settings', Component: Settings },
    { path: '/Chatbot', Component: Chatbot },
  ];

  return (
    <Routes>
      <Route path="/auth" element={isAuthenticated ? <Navigate to="/Dashboard" replace /> : <AuthPage />} />
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      {pages.map(({ path, Component }) => (
        <Route key={path} path={path} element={<ProtectedRoute><Layout><Component /></Layout></ProtectedRoute>} />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router><AppRoutes /></Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}
