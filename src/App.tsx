import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Lazy load pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ExamPage = lazy(() => import('./pages/ExamPage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const QuestionBankPage = lazy(() => import('./pages/QuestionBankPage'));
const AdminCreateExam = lazy(() => import('./pages/AdminCreateExam'));
const AdminManageQuestions = lazy(() => import('./pages/AdminManageQuestions'));
const AdminExamDetails = lazy(() => import('./pages/AdminExamDetails'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-primary">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" toastOptions={{
          style: {
            background: '#1A1A2E',
            color: '#FAF0E6',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }} />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthPage type="login" />} />
            <Route path="/register" element={<AuthPage type="register" />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Student Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute role="student">
                <Layout><StudentDashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/exams" element={
              <ProtectedRoute role="student">
                <Layout><StudentDashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/exam/:id" element={
              <ProtectedRoute role="student">
                <ExamPage />
              </ProtectedRoute>
            } />
            <Route path="/results/:id" element={
              <ProtectedRoute role="student">
                <Layout><ResultsPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute role="student">
                <Layout><ProfilePage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout><ProfilePage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute role="student">
                <Layout><AnalyticsPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/question-bank" element={
              <ProtectedRoute role="student">
                <Layout><QuestionBankPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout><SettingsPage /></Layout>
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute role="admin">
                <Layout><AdminDashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/exams" element={
              <ProtectedRoute role="admin">
                <Layout><AdminDashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/exams/:id" element={
              <ProtectedRoute role="admin">
                <Layout><AdminExamDetails /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/create-exam" element={
              <ProtectedRoute role="admin">
                <Layout><AdminCreateExam /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/questions" element={
              <ProtectedRoute role="admin">
                <Layout><AdminManageQuestions /></Layout>
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}
