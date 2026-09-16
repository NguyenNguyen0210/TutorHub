import React, { useState, useEffect } from 'react';
import tutorService from '@/services/tutor.service';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/utils/formatters';
import { getTeachingModeMeta } from '@/config/enums';
import { CardSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';

export default function TutorServices() {
  const { user } = useAuthStore();
  const tutorId = user?.tutorProfileId || user?.id;

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadServices() {
      if (!tutorId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const list = await tutorService.getTutorServices(tutorId);
        if (isMounted) {
          setServices(Array.isArray(list) ? list : []);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadServices();
    return () => {
      isMounted = false;
    };
  }, [tutorId]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Quản Lý Danh Mục Gói Dịch Vụ Giảng Dạy
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Các gói học theo số buổi, thời lượng và cam kết đầu ra bảo chứng Escrow
          </p>
        </div>
      </div>

      {loading && <CardSkeleton count={3} />}

      {error && (
        <ErrorState
          error={error}
          title="Không thể tải danh sách gói dịch vụ"
          onRetry={() => window.location.reload()}
        />
      )}

      {!loading && !error && services.length === 0 && (
        <EmptyState
          icon="inventory_2"
          title="Chưa có gói dịch vụ nào"
          description="Bạn chưa tạo gói dịch vụ giảng dạy nào. Vui lòng hoàn tất hồ sơ gia sư để đăng ký gói học."
        />
      )}

      {!loading && !error && services.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((pkg) => {
            const modeMeta = getTeachingModeMeta(pkg.teachingMode);
            return (
              <div
                key={pkg.id}
                className="p-6 rounded-3xl bg-white border border-border-light shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-financial-available text-[10px] font-extrabold uppercase border border-emerald-200">
                      Đang Tuyển Sinh
                    </span>
                    <span className="text-xs font-bold text-brand-indigo-600 font-monospace-num">
                      {pkg.totalSessions} buổi
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{pkg.title}</h3>

                  <div className="space-y-1.5 text-xs text-text-secondary pt-2 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span>Môn học:</span>
                      <span className="font-bold text-slate-800">{pkg.subjectName || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Thời lượng buổi:</span>
                      <span className="font-bold text-slate-800">
                        {pkg.sessionDurationMinutes || 60} phút
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hình thức:</span>
                      <span className="font-bold text-slate-800">{modeMeta.label}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border-light space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-text-muted">Học phí trọn gói:</span>
                    <span className="text-xl font-extrabold text-financial-available font-monospace-num">
                      {formatCurrency(pkg.price)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
