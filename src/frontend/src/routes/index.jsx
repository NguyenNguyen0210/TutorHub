import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Deep link redirect helpers for notifications and external URLs
function EnrollmentRedirect() {
  const { id } = useParams();
  return <Navigate to={`/student/enrollments/${id}`} replace />;
}

function SessionRedirect() {
  const { id } = useParams();
  const { role } = useAuthStore();
  if (role === 'Tutor') {
    return <Navigate to={`/tutor/sessions/${id}`} replace />;
  }
  return <Navigate to={`/student/sessions/${id}`} replace />;
}

function BookingRedirect() {
  const { id } = useParams();
  return <Navigate to={`/student/bookings/${id}/checkout`} replace />;
}

function SettingsRedirect() {
  const { role } = useAuthStore();
  if (role === 'Tutor') return <Navigate to="/tutor/settings" replace />;
  if (role === 'Admin') return <Navigate to="/admin/settings" replace />;
  return <Navigate to="/student/settings" replace />;
}

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import StudentLayout from '../layouts/StudentLayout';
import TutorLayout from '../layouts/TutorLayout';
import AdminLayout from '../layouts/AdminLayout';
import AuthLayout from '../layouts/AuthLayout';

// Auth & Onboarding Screens
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import TutorApplication from '../pages/tutor/TutorApplication';

// Discovery Screens
import Marketplace from '../pages/discovery/Marketplace';
import TutorProfile from '../pages/discovery/TutorProfile';

// Checkout Screens
import BookingCheckout from '../pages/checkout/BookingCheckout';
import PaymentReturn from '../pages/checkout/PaymentReturn';

import StudentDashboard from '../pages/student/StudentDashboard';
import StudentWallet from '../pages/student/StudentWallet';
import EnrollmentDetail from '../pages/student/EnrollmentDetail';
import SessionDetail from '../pages/student/SessionDetail';
import DisputeNew from '../pages/student/DisputeNew';

// Tutor Space & Wallet Screens
import TutorDashboard from '../pages/tutor/TutorDashboard';
import TutorAvailability from '../pages/tutor/TutorAvailability';
import TutorServices from '../pages/tutor/TutorServices';
import TutorWallet from '../pages/tutor/TutorWallet';
import TutorWithdraw from '../pages/tutor/TutorWithdraw';

// Shared Realtime Screens
import Messages from '../pages/shared/Messages';
import Notifications from '../pages/shared/Notifications';
import ProfileSettings from '../pages/shared/ProfileSettings';
import NotFound from '../pages/shared/NotFound';

// Admin Space Screens
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminWithdrawals from '../pages/admin/AdminWithdrawals';
import AdminStudentWallets from '../pages/admin/AdminStudentWallets';
import AdminTutorApplications from '../pages/admin/AdminTutorApplications';
import AdminDisputes from '../pages/admin/AdminDisputes';
import AdminDisputeDetail from '../pages/admin/AdminDisputeDetail';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminAuditLogs from '../pages/admin/AdminAuditLogs';

// Guards
import { RequireAuth, RequireRole, GuestGuard } from './RouteGuards';

export default function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public Routes (no auth required) */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Navigate to="/tutors" replace />} />
        <Route path="/tutors" element={<Marketplace />} />
        <Route path="/tutors/:id" element={<TutorProfile />} />

        {/* Protected: requires login */}
        <Route path="/student/bookings/:id/checkout" element={
          <RequireAuth><BookingCheckout /></RequireAuth>
        } />
        <Route path="/payment/return" element={<PaymentReturn />} />
        <Route path="/app/messages" element={
          <RequireAuth><Messages /></RequireAuth>
        } />
        <Route path="/app/notifications" element={
          <RequireAuth><Notifications /></RequireAuth>
        } />
      </Route>

      {/* 2. Auth Routes */}
      <Route path="/auth/login" element={<GuestGuard><Login /></GuestGuard>} />
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/auth/register" element={<GuestGuard><Register /></GuestGuard>} />
      <Route path="/register" element={<Navigate to="/auth/register" replace />} />
      <Route element={<AuthLayout />}>
        <Route path="/tutor/application" element={<RequireAuth><TutorApplication /></RequireAuth>} />
        <Route path="/tutor/onboarding" element={<Navigate to="/tutor/application" replace />} />
      </Route>

      {/* 3. Student Routes (auth + Student role) */}
      <Route path="/student" element={
        <RequireAuth>
          <RequireRole allowedRoles={['Student']}>
            <StudentLayout />
          </RequireRole>
        </RequireAuth>
      }>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="wallet" element={<StudentWallet />} />
        <Route path="enrollments/:id" element={<EnrollmentDetail />} />
        <Route path="sessions/:id" element={<SessionDetail />} />
        <Route path="disputes/new" element={<DisputeNew />} />
        <Route path="settings" element={<ProfileSettings />} />
        <Route path="profile" element={<Navigate to="/student/settings" replace />} />
      </Route>

      {/* 4. Tutor Routes (auth + Tutor role) */}
      <Route path="/tutor" element={
        <RequireAuth>
          <RequireRole allowedRoles={['Tutor']}>
            <TutorLayout />
          </RequireRole>
        </RequireAuth>
      }>
        <Route path="dashboard" element={<TutorDashboard />} />
        <Route path="availability" element={<TutorAvailability />} />
        <Route path="services" element={<TutorServices />} />
        <Route path="wallet" element={<TutorWallet />} />
        <Route path="wallet/withdraw" element={<TutorWithdraw />} />
        <Route path="sessions/:id" element={<SessionDetail />} />
        <Route path="settings" element={<ProfileSettings />} />
        <Route path="profile" element={<Navigate to="/tutor/settings" replace />} />
      </Route>

      {/* 5. Admin Routes (auth + Admin role) */}
      <Route path="/admin" element={
        <RequireAuth>
          <RequireRole allowedRoles={['Admin']}>
            <AdminLayout />
          </RequireRole>
        </RequireAuth>
      }>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="student-wallets" element={<AdminStudentWallets />} />
        <Route path="withdrawals" element={<AdminWithdrawals />} />
        <Route path="disputes" element={<AdminDisputes />} />
        <Route path="tutor-applications" element={<AdminTutorApplications />} />
        <Route path="disputes/:id" element={<AdminDisputeDetail />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />
        <Route path="settings" element={<ProfileSettings />} />
        <Route path="profile" element={<Navigate to="/admin/settings" replace />} />
      </Route>

      {/* Deep Link Redirections (from notifications & external URLs) */}
      <Route path="/student/wallet" element={<RequireAuth><Navigate to="/student/wallet" replace /></RequireAuth>} />
      <Route path="/admin/student-topups" element={<RequireAuth><Navigate to="/admin/student-wallets" replace /></RequireAuth>} />
      <Route path="/admin/student-withdrawals" element={<RequireAuth><Navigate to="/admin/student-wallets" replace /></RequireAuth>} />
      <Route path="/enrollments/:id" element={<RequireAuth><EnrollmentRedirect /></RequireAuth>} />
      <Route path="/sessions/:id" element={<RequireAuth><SessionRedirect /></RequireAuth>} />
      <Route path="/bookings/:id" element={<RequireAuth><BookingRedirect /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><SettingsRedirect /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><SettingsRedirect /></RequireAuth>} />
      <Route path="/chat/:id" element={<RequireAuth><Navigate to="/app/messages" replace /></RequireAuth>} />
      <Route path="/chat" element={<RequireAuth><Navigate to="/app/messages" replace /></RequireAuth>} />

      {/* 404 Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}