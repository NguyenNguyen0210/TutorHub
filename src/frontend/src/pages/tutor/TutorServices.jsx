import React, { useState, useEffect } from 'react';
import tutorService from '@/services/tutor.service';
import Money from '@/components/ui/Money';
import { getTeachingModeMeta } from '@/config/enums';
import { CardSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/StatCard';

export default function TutorServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadServices() {
      try {
        setLoading(true);
        const list = await tutorService.getMyServices();
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
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý danh mục gói dịch vụ giảng dạy"
        subtitle="Các gói học theo số buổi, thời lượng và cam kết đầu ra bảo chứng Escrow"
      />

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {services.map((pkg) => {
            const modeMeta = getTeachingModeMeta(pkg.teachingMode);
            return (
              <Card key={pkg.id} hoverable className="flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="success" size="sm">
                      Đang tuyển sinh
                    </Badge>
                    <span className="text-caption font-bold text-brand-primary-700 font-mono">
                      {pkg.totalSessions} buổi
                    </span>
                  </div>
                  <h3 className="text-headline-3 text-fg">{pkg.title}</h3>

                  <dl className="space-y-1.5 text-caption text-fg-secondary pt-2 border-t border-border">
                    <div className="flex justify-between">
                      <dt>Môn học:</dt>
                      <dd className="font-semibold text-fg">{pkg.subjectName || '—'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Thời lượng buổi:</dt>
                      <dd className="font-semibold text-fg">
                        {pkg.sessionDurationMinutes || 60} phút
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Hình thức:</dt>
                      <dd className="font-semibold text-fg">{modeMeta.label}</dd>
                    </div>
                  </dl>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-baseline justify-between">
                    <span className="text-caption text-fg-muted">Học phí trọn gói:</span>
                    <span className="text-headline-2 text-success-strong font-semibold">
                      <Money value={pkg.price} />
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
