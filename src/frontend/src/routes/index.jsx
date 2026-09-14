import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import StudentLayout from '../layouts/StudentLayout';
import TutorLayout from '../layouts/TutorLayout';
import AdminLayout from '../layouts/AdminLayout';
import AuthLayout from '../layouts/AuthLayout';

// Auth & Onboarding Screens (Batch A)
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import TutorApplication from '../pages/tutor/TutorApplication';

// Discovery Screens
import Marketplace from '../pages/discovery/Marketplace';
import TutorProfile from '../pages/discovery/TutorProfile';

// Checkout Screens
import BookingCheckout from '../pages/checkout/BookingCheckout';
import PaymentReturn from '../pages/checkout/PaymentReturn';

// Student Space Screens
import StudentDashboard from '../pages/student/StudentDashboard';
import EnrollmentDetail from '../pages/student/EnrollmentDetail';
import SessionDetail from '../pages/student/SessionDetail';
import DisputeNew from '../pages/student/DisputeNew';

// Tutor Space & Wallet Screens (Batch B)
import TutorDashboard from '../pages/tutor/TutorDashboard';
import TutorAvailability from '../pages/tutor/TutorAvailability';
import TutorServices from '../pages/tutor/TutorServices';
import TutorWallet from '../pages/tutor/TutorWallet';
import TutorWithdraw from '../pages/tutor/TutorWithdraw';

// Shared Realtime Screens (Batch C)
import Messages from '../pages/shared/Messages';
import Notifications from '../pages/shared/Notifications';

// Admin Space Screens (Batch D)
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminTutorApplications from '../pages/admin/AdminTutorApplications';
import AdminDisputeDetail from '../pages/admin/AdminDisputeDetail';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminAuditLogs from '../pages/admin/AdminAuditLogs';

// Guards
import { RequireAuth, RequireRole, GuestGuard } from './RouteGuards';

export default function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Navigate to="/tutors" replace />} />
        
        {/* Screen 3: Discovery Marketplace */}
        <Route path="/tutors" element={<Marketplace />} />

        {/* Screen 4: Tutor Profile & Services */}
        <Route path="/tutors/:id" element={<TutorProfile />} />

        {/* Screen 5: Booking Checkout (Holding 15p) */}
        <Route path="/student/bookings/:id/checkout" element={<BookingCheckout />} />

        {/* Screen 6: Payment Return (VNPay Result) */}
        <Route path="/payment/return" element={<PaymentReturn />} />

        {/* Screen 16: Shared Realtime Chat & Custom Agreement */}
        <Route path="/app/messages" element={<Messages />} />

        {/* Screen 17: Multi-channel Notifications Center */}
        <Route path="/app/notifications" element={<Notifications />} />
      </Route>

      {/* 2. Auth Routes */}
      <Route element={<AuthLayout />}>
        {/* Screen 1: Login & Fast Switcher */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/register" element={<Navigate to="/auth/register" replace />} />
        
        {/* Screen 2: 4-Step Tutor Onboarding Wizard */}
        <Route path="/tutor/application" element={<TutorApplication />} />
        <Route path="/tutor/onboarding" element={<Navigate to="/tutor/application" replace />} />
      </Route>

      {/* 3. Student Routes */}
      <Route path="/student" element={<StudentLayout />}>
        {/* Screen 7: Student Dashboard & Progress */}
        <Route path="dashboard" element={<StudentDashboard />} />

        {/* Screen 8: Enrollment Contract Hub & Pro-Rata Calculator */}
        <Route path="enrollments/:id" element={<EnrollmentDetail />} />

        {/* Screen 9: 24h Dual Attendance & Telemetry Verification */}
        <Route path="sessions/:id" element={<SessionDetail />} />

        {/* Screen 10: Dispute Filing (DEC-S8 Protocol) */}
        <Route path="disputes/new" element={<DisputeNew />} />
      </Route>

      {/* 4. Tutor Routes */}
      <Route path="/tutor" element={<TutorLayout />}>
        {/* Screen 11: Tutor Dashboard & Today's Schedule */}
        <Route path="dashboard" element={<TutorDashboard />} />

        {/* Screen 12: Weekly Availability Matrix */}
        <Route path="availability" element={<TutorAvailability />} />

        {/* Screen 13: Service Packages Management */}
        <Route path="services" element={<TutorServices />} />

        {/* Screen 14: Escrow Wallet & 4 Balances */}
        <Route path="wallet" element={<TutorWallet />} />

        {/* Screen 15: Withdrawal Request & KYC Bank */}
        <Route path="wallet/withdraw" element={<TutorWithdraw />} />
      </Route>

      {/* 5. Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        {/* Screen 18: Admin Master Dashboard & GMV Supervision */}
        <Route path="dashboard" element={<AdminDashboard />} />

        {/* Screen 19: Tutor Applications & Degree Verification */}
        <Route path="tutor-applications" element={<AdminTutorApplications />} />

        {/* Screen 20: DEC-S8-025 Dispute Arbitration Desk */}
        <Route path="disputes/:id" element={<AdminDisputeDetail />} />

        {/* Screen 21: User Governance & Absent Strike Policy */}
        <Route path="users" element={<AdminUsers />} />

        {/* Screen 22: Central Immutable Audit Log (SHA-256 HMAC) */}
        <Route path="audit-logs" element={<AdminAuditLogs />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={
        <div className="p-12 text-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">404 — Tuyến Đường Không Tồn Tại</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Trang bạn yêu cầu chưa được định tuyến hoặc không hợp lệ.</p>
          <a href="/tutors" className="text-indigo-600 font-bold text-xs hover:underline">Về Trang Khám Phá</a>
        </div>
      } />
    </Routes>
  );
}
