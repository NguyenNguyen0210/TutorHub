import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';
import Tabs from '@/components/ui/Tabs';
import { Pagination } from '@/components/ui/Table';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import MarketplaceCardSkeleton from '@/components/discovery/MarketplaceCardSkeleton';
import TutorCard from '@/components/discovery/TutorCard';
import ServiceCard from '@/components/discovery/ServiceCard';
import { wishlistService } from '@/services/wishlistService';
import { useWishlist } from '@/hooks/useWishlist';

const PAGE_SIZE = 10;

function ServiceCardSkeleton({ count = 6 }) {
  return (
    <div
      role="status"
      aria-label="Đang tải danh sách dịch vụ đã lưu..."
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          aria-hidden="true"
          className="mkt-card relative flex flex-col p-5 sm:p-6 bg-white animate-pulse"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="h-6 w-28 rounded-full bg-neutral-200/80" />
            <div className="h-9 w-9 rounded-full bg-neutral-200/80" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-5 w-4/5 rounded bg-neutral-200/80" />
            <div className="h-5 w-3/5 rounded bg-neutral-200/80" />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-neutral-200/80 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-1/2 rounded bg-neutral-200/80" />
              <div className="h-3 w-1/3 rounded bg-neutral-200/80" />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl border border-neutral-100 bg-neutral-50 p-3">
            <div className="h-8 rounded bg-neutral-200/60" />
            <div className="h-8 rounded bg-neutral-200/60" />
          </div>
          <div className="mt-auto flex items-end justify-between border-t border-[color:var(--mkt-line)] pt-5">
            <div className="space-y-1">
              <div className="h-3 w-16 rounded bg-neutral-200/80" />
              <div className="h-5 w-24 rounded bg-neutral-200/80" />
            </div>
            <div className="h-10 w-24 rounded-xl bg-neutral-200/80" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StudentWishlist() {
  const [activeTab, setActiveTab] = useState('Tutor');
  const [page, setPage] = useState(1);

  const { wishlistIds } = useWishlist();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['wishlist', 'items', activeTab, page],
    queryFn: () => wishlistService.getWishlistItems(activeTab, page, PAGE_SIZE),
  });

  const handleTabChange = (key) => {
    setActiveTab(key);
    setPage(1);
  };

  const items = data?.items || [];
  const totalCount = Number(data?.totalCount ?? 0);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  // Real-time counter badges using lightweight IDs cache with fallback to query totalCount
  const tutorCount =
    activeTab === 'Tutor' && data?.totalCount != null
      ? data.totalCount
      : wishlistIds?.tutorIds?.length ?? 0;

  const serviceCount =
    activeTab === 'Service' && data?.totalCount != null
      ? data.totalCount
      : wishlistIds?.serviceIds?.length ?? 0;

  const tabs = [
    {
      key: 'Tutor',
      label: (
        <span className="flex items-center gap-2">
          <span>Gia sư đã lưu</span>
          <span
            className={cn(
              'inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold tabular-nums transition-colors',
              activeTab === 'Tutor'
                ? 'bg-brand-primary-100 text-brand-primary-700'
                : 'bg-neutral-100 text-fg-muted'
            )}
          >
            {tutorCount}
          </span>
        </span>
      ),
      icon: <Icon name="person" size="sm" />,
    },
    {
      key: 'Service',
      label: (
        <span className="flex items-center gap-2">
          <span>Dịch vụ đã lưu</span>
          <span
            className={cn(
              'inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold tabular-nums transition-colors',
              activeTab === 'Service'
                ? 'bg-brand-primary-100 text-brand-primary-700'
                : 'bg-neutral-100 text-fg-muted'
            )}
          >
            {serviceCount}
          </span>
        </span>
      ),
      icon: <Icon name="inventory_2" size="sm" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-headline-page text-fg tracking-tight">
            Danh sách đã lưu
          </h1>
          <p className="text-body-reg text-fg-secondary mt-1">
            Quản lý các gia sư và gói dịch vụ học tập bạn đã đánh dấu quan tâm để dễ dàng so sánh và đăng ký học.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} value={activeTab} onChange={handleTabChange} />

      {/* Content Area */}
      <div>
        {isLoading ? (
          activeTab === 'Tutor' ? (
            <MarketplaceCardSkeleton count={6} />
          ) : (
            <ServiceCardSkeleton count={6} />
          )
        ) : isError ? (
          <ErrorState
            error={error}
            title={
              activeTab === 'Tutor'
                ? 'Không thể tải danh sách gia sư đã lưu'
                : 'Không thể tải danh sách dịch vụ đã lưu'
            }
            message={
              error?.message ||
              'Đã có lỗi xảy ra khi kết nối máy chủ. Vui lòng nhấn thử lại.'
            }
            onRetry={() => refetch()}
            className="!border-[color:var(--mkt-line)] !bg-white"
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon="favorite"
            title={
              activeTab === 'Tutor'
                ? 'Bạn chưa lưu gia sư nào'
                : 'Bạn chưa lưu dịch vụ nào'
            }
            description={
              activeTab === 'Tutor'
                ? 'Khám phá các gia sư giàu kinh nghiệm, xem đánh giá và lưu lại hồ sơ ưng ý.'
                : 'Khám phá các dịch vụ và gói học chuyên sâu phù hợp với lộ trình học của bạn.'
            }
            actionLabel={
              activeTab === 'Tutor' ? 'Khám phá gia sư' : 'Xem danh mục dịch vụ'
            }
            actionPath={activeTab === 'Tutor' ? '/' : '/services'}
            className="!border-[color:var(--mkt-line)] !bg-white"
          />
        ) : (
          <div className="space-y-6">
            {activeTab === 'Tutor' ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {items.map((item) => {
                  const tutor = {
                    ...item,
                    id: item.tutorProfileId || item.id,
                    fullName: item.fullName || 'Gia sư',
                    avatarUrl: item.avatarUrl || item.avatar,
                    bio: item.bio || '',
                    education: item.education || '',
                    experienceYears: Number(item.experienceYears ?? 0),
                    ratingAvg: Number(item.ratingAvg ?? 0),
                    totalReviews: Number(item.totalReviews ?? 0),
                    subjects: item.subjects || [],
                    minPrice: item.minPrice != null ? Number(item.minPrice) : null,
                    isVerified: Boolean(item.isVerified),
                  };
                  return <TutorCard key={item.id || item.tutorProfileId} tutor={tutor} />;
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => {
                  const service = {
                    ...item,
                    id: item.serviceId || item.id,
                    tutorProfileId: item.tutorProfileId,
                    tutorName: item.tutorName || 'Gia sư',
                    tutorAvatarUrl: item.tutorAvatarUrl || item.tutorAvatar,
                    title: item.title,
                    price: Number(item.price ?? 0),
                    totalSessions: item.totalSessions,
                    sessionDurationMinutes: item.sessionDurationMinutes,
                    subjectName: item.subjectName,
                  };
                  return <ServiceCard key={item.id || item.serviceId} service={service} />;
                })}
              </div>
            )}

            {/* Pagination controls when totalCount > 10 */}
            {totalCount > PAGE_SIZE && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
                <p className="text-caption text-fg-secondary">
                  Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} trong{' '}
                  {totalCount} {activeTab === 'Tutor' ? 'gia sư' : 'dịch vụ'}
                </p>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  onChange={setPage}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
