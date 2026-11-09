import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Deep link redirect helpers for notifications and external URLs
function EnrollmentRedirect() {
  const { id } = useParams();
  const { role } = useAuthStore();
  if (role === 'Tutor') {
    return <Navigate to={`/tutor/enrollments/${id}`} replace />;
  }
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
import WorkspaceLayout from '../layouts/WorkspaceLayout';

// Guards
import { RequireAuth, RequireRole, RequireApprovedTutor, GuestGuard } from './RouteGuards';

function loadPage(loader) {
  const Page = lazy(loader);
  return function LazyPage(props) {
    return <Suspense fallback={<div role="status" aria-live="polite" className="mx-auto max-w-[1200px] px-4 py-10 text-sm text-fg-secondary">Đang tải nội dung…</div>}><Page {...props} /></Suspense>;
  };
}

const NotificationTarget = loadPage(() => import('../pages/shared/NotificationTarget'));
const DisputeDetail = loadPage(() => import('../pages/shared/DisputeDetail'));
const Login = loadPage(() => import('../pages/auth/Login'));
const Register = loadPage(() => import('../pages/auth/Register'));
const ForgotPassword = loadPage(() => import('../pages/auth/ForgotPassword'));
const OAuthCallback = loadPage(() => import('../pages/auth/OAuthCallback'));
const TutorApplication = loadPage(() => import('../pages/tutor/TutorApplication'));
const Marketplace = loadPage(() => import('../pages/discovery/Marketplace'));
const BecomeTutor = loadPage(() => import('../pages/discovery/BecomeTutor'));
const TutorProfile = loadPage(() => import('../pages/discovery/TutorProfile'));
const ServicesMarketplace = loadPage(() => import('../pages/discovery/ServicesMarketplace'));
const ServiceDetail = loadPage(() => import('../pages/discovery/ServiceDetail'));
const HowItWorks = loadPage(() => import('../pages/discovery/HowItWorks'));
const BookingCheckout = loadPage(() => import('../pages/checkout/BookingCheckout'));
const PaymentReturn = loadPage(() => import('../pages/checkout/PaymentReturn'));
const StudentDashboard = loadPage(() => import('../pages/student/StudentDashboard'));
const StudentWallet = loadPage(() => import('../pages/student/StudentWallet'));
const StudentWalletTopUp = loadPage(() => import('../pages/student/StudentWalletTopUp'));
const StudentWalletWithdraw = loadPage(() => import('../pages/student/StudentWalletWithdraw'));
const EnrollmentDetail = loadPage(() => import('../pages/student/EnrollmentDetail'));
const SessionDetail = loadPage(() => import('../pages/student/SessionDetail'));
const DisputeNew = loadPage(() => import('../pages/student/DisputeNew'));
const StudentWishlist = loadPage(() => import('../pages/student/StudentWishlist'));
const StudentSchedule = loadPage(() => import('../pages/student/StudentSchedule'));
const StudentBookings = loadPage(() => import('../pages/student/StudentBookings'));
const StudentReports = loadPage(() => import('../pages/student/StudentReports'));
const MyDisputes = loadPage(() => import('../pages/shared/MyDisputes'));
const LegalPolicy = loadPage(() => import('../pages/shared/LegalPolicy'));
const TutorDashboard = loadPage(() => import('../pages/tutor/TutorDashboard'));
const TutorSchedule = loadPage(() => import('../pages/tutor/TutorSchedule'));
const TutorServices = loadPage(() => import('../pages/tutor/TutorServices'));
const ServiceCreateWizard = loadPage(() => import('../pages/tutor/ServiceCreateWizard'));
const ServiceEdit = loadPage(() => import('../pages/tutor/ServiceEdit'));
const TutorWallet = loadPage(() => import('../pages/tutor/TutorWallet'));
const TutorWithdraw = loadPage(() => import('../pages/tutor/TutorWithdraw'));
const Messages = loadPage(() => import('../pages/shared/Messages'));
const Notifications = loadPage(() => import('../pages/shared/Notifications'));
const ProfileSettings = loadPage(() => import('../pages/shared/ProfileSettings'));
const NotFound = loadPage(() => import('../pages/shared/NotFound'));
const AdminDashboard = loadPage(() => import('../pages/admin/AdminDashboard'));
const AdminWithdrawals = loadPage(() => import('../pages/admin/AdminWithdrawalRequests'));
const AdminStudentWallets = loadPage(() => import('../pages/admin/AdminStudentWallets'));
const AdminTutorApplications = loadPage(() => import('../pages/admin/AdminPeople').then(module => ({ default: module.AdminApplicationRedirect })));
const AdminStudentWithdrawalRedirect = loadPage(() => import('../pages/admin/AdminPeople').then(module => ({ default: module.AdminStudentWithdrawalRedirect })));
const AdminDisputes = loadPage(() => import('../pages/admin/AdminDisputes'));
const AdminDisputeDetail = loadPage(() => import('../pages/admin/AdminDisputeDetail'));
const AdminUsers = loadPage(() => import('../pages/admin/AdminPeople'));
const AdminCatalog = loadPage(() => import('../pages/admin/AdminCatalog'));
const AdminTransactions = loadPage(() => import('../pages/admin/AdminTransactions'));
const AdminEnrollmentDetail = loadPage(() => import('../pages/admin/AdminEnrollmentDetail'));
const AdminEnrollments = loadPage(() => import('../pages/admin/AdminEnrollments'));
const AdminServices = loadPage(() => import('../pages/admin/AdminServices'));
const AdminConversations = loadPage(() => import('../pages/admin/AdminConversations'));
const AdminRevenue = loadPage(() => import('../pages/admin/AdminRevenue'));
const AdminTrustReports = loadPage(() => import('../pages/admin/AdminTrustReports'));
const AdminAuditLogs = loadPage(() => import('../pages/admin/AdminAuditLogs'));

export default function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public Routes (no auth required) */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Marketplace />} />
        <Route path="/tutors" element={<Navigate to="/" replace />} />
        <Route path="/tutors/:id" element={<TutorProfile />} />
        <Route path="/services" element={<ServicesMarketplace />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/service" element={<Navigate to="/services" replace />} />
        <Route path="/service/:id" element={<ServiceDetail />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/terms" element={<LegalPolicy kind="terms" />} />
        <Route path="/privacy" element={<LegalPolicy kind="privacy" />} />
        <Route path="/become-tutor" element={<BecomeTutor />} />

        {/* Protected: requires login */}
        <Route path="/student/bookings/:id/checkout" element={
          <RequireAuth><BookingCheckout /></RequireAuth>
        } />
        <Route path="/payment/return" element={
          <RequireAuth><PaymentReturn /></RequireAuth>
        } />
        <Route path="/tutor/onboarding" element={<Navigate to="/tutor/application" replace />} />
      </Route>

      {/* 2b. Shared workspace routes (Hộp thư, Thông báo) — dùng shell của vai trò
           đang đăng nhập, KHÔNG dùng PublicLayout: trước đây bấm "Tin nhắn" làm
           mất sidebar và hiện topbar công khai lên trên. */}
      <Route path="/app" element={
        <RequireAuth>
          <WorkspaceLayout />
        </RequireAuth>
      }>
        <Route path="messages" element={<Messages />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="notifications/:id" element={<NotificationTarget />} />
        <Route path="reports" element={<StudentReports />} />
        <Route path="disputes/:id" element={<DisputeDetail />} />
        <Route path="*" element={<NotFound embedded />} />
      </Route>

      {/* 2. Auth Routes */}
      <Route path="/auth/login" element={<GuestGuard><Login /></GuestGuard>} />
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/auth/register" element={<GuestGuard><Register /></GuestGuard>} />
      <Route path="/auth/forgot-password" element={<GuestGuard><ForgotPassword /></GuestGuard>} />
      <Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />
      <Route path="/auth/oauth/callback" element={<OAuthCallback />} />
      <Route path="/register" element={<Navigate to="/auth/register" replace />} />

      {/* 3. Student Routes (auth + Student role) */}
      <Route path="/student" element={
        <RequireAuth>
          <RequireRole allowedRoles={['Student']}>
            <StudentLayout />
          </RequireRole>
        </RequireAuth>
      }>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="schedule" element={<StudentSchedule />} />
        <Route path="bookings" element={<StudentBookings />} />
        <Route path="disputes" element={<MyDisputes />} />
        <Route path="reports" element={<StudentReports />} />
        <Route path="wallet" element={<StudentWallet />} />
        <Route path="wallet/topup" element={<StudentWalletTopUp />} />
        <Route path="wallet/withdraw" element={<StudentWalletWithdraw />} />
        <Route path="enrollments/:id" element={<EnrollmentDetail />} />
        <Route path="sessions/:id" element={<SessionDetail />} />
        <Route path="disputes/new" element={<DisputeNew />} />
        <Route path="wishlist" element={<StudentWishlist />} />
        <Route path="settings" element={<ProfileSettings />} />
        <Route path="profile" element={<Navigate to="/student/settings" replace />} />
        <Route path="*" element={<NotFound embedded />} />
      </Route>

      {/* Applications retain the signed-in role's workspace, including first-time applicants. */}
      <Route path="/tutor/application" element={<RequireAuth><WorkspaceLayout /></RequireAuth>}>
        <Route index element={<TutorApplication />} />
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
        <Route path="disputes" element={<MyDisputes />} />
        <Route path="schedule" element={<TutorSchedule />} />
        <Route path="availability" element={<Navigate to="/tutor/schedule" replace />} />
        <Route path="services" element={<TutorServices />} />
        <Route path="services/new" element={<RequireApprovedTutor><ServiceCreateWizard /></RequireApprovedTutor>} />
        <Route path="services/:id/edit" element={<ServiceEdit />} />
        <Route path="enrollments/:id" element={<EnrollmentDetail />} />
        <Route path="wallet" element={<TutorWallet />} />
        <Route path="wallet/withdraw" element={<TutorWithdraw />} />
        <Route path="sessions/:id" element={<SessionDetail />} />
        <Route path="settings" element={<ProfileSettings />} />
        <Route path="profile" element={<Navigate to="/tutor/settings" replace />} />
        <Route path="*" element={<NotFound embedded />} />
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
        <Route path="categories" element={<AdminCatalog key="categories" />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="conversations" element={<AdminConversations />} />
        <Route path="revenue" element={<AdminRevenue />} />
        <Route path="enrollments" element={<AdminEnrollments />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="enrollments/:id" element={<AdminEnrollmentDetail />} />
        <Route path="subjects" element={<AdminCatalog key="subjects" />} />
        <Route path="trust-reports" element={<AdminTrustReports />} />
        <Route path="trust-reports/:id" element={<AdminTrustReports />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />
        <Route path="settings" element={<ProfileSettings />} />
        <Route path="profile" element={<Navigate to="/admin/settings" replace />} />
        <Route path="*" element={<NotFound embedded />} />
      </Route>

      {/* Deep Link Redirections (from notifications & external URLs) */}
      <Route path="/admin/student-topups" element={<RequireAuth><Navigate to="/admin/student-wallets" replace /></RequireAuth>} />
      <Route path="/admin/student-withdrawals" element={<RequireAuth><AdminStudentWithdrawalRedirect /></RequireAuth>} />
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
