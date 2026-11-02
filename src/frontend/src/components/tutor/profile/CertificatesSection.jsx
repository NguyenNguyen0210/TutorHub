import React from 'react';
import PropTypes from 'prop-types';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import Badge from '@/components/ui/Badge';
import { SectionShell } from './SectionShell';

export default function CertificatesSection({ tutor, id = 'bang-cap' }) {
  const credentials = Array.isArray(tutor.credentials) ? tutor.credentials : [];
  if (credentials.length === 0) return null;

  return (
    <SectionShell id={id} title="Chứng chỉ & Bằng cấp" icon="military_tech" className="mt-8">
      <div className="space-y-4">
        {/* Lưới các thẻ văn bằng / chứng chỉ */}
        <div className="grid grid-cols-1 gap-4">
          {credentials.map((item) => (
            <Card
              key={item.id}
              padding="lg"
              className="border border-border hover:border-brand-primary-300 transition-colors shadow-sm bg-surface rounded-2xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className="w-11 h-11 rounded-xl shrink-0 border flex items-center justify-center bg-brand-primary-50 border-brand-primary-100"
                  >
                    <Icon name={item.kind === 'certificate' ? 'workspace_premium' : 'school'} size="md" className="text-brand-primary-600" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <span className="text-[11px] font-bold text-fg-muted uppercase tracking-wider block">
                      {item.type}
                    </span>
                    <h3 className="text-body-lg font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-[13px] text-fg-secondary font-medium m-0">
                      {item.institution}
                    </p>

                    {item.major && (
                      <p className="text-[12px] text-fg-muted m-0">
                        Chuyên ngành: <span className="text-fg-secondary font-medium">{item.major}</span>
                      </p>
                    )}

                    {item.graduationGrade && (
                      <p className="text-[12px] text-fg-muted m-0">
                        {item.graduationGrade}
                      </p>
                    )}

                    {item.details && (
                      <p className="text-[12px] text-fg-muted m-0">
                        {item.details}
                      </p>
                    )}

                    {/* Điểm thành phần IELTS nếu có */}
                    {item.scores && (
                      <div className="flex flex-wrap gap-2 pt-1.5">
                        {item.scores.map((s) => (
                          <span
                            key={s.label}
                            className="inline-flex items-center gap-1 text-[11px] font-medium bg-neutral-100 text-slate-800 px-2 py-0.5 rounded-md border border-neutral-200/80"
                          >
                            <span className="text-fg-muted">{s.label}:</span>
                            <span className="font-bold text-slate-900">{s.score}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Huy hiệu xác thực */}
                {item.isApproved === true && <div className="sm:self-start shrink-0">
                  <Badge
                    variant="success"
                    size="sm"
                    className="inline-flex items-center gap-1.5 font-semibold text-[11px] py-1 px-2.5 shadow-none"
                  >
                    <Icon name="verified" size="xs" />
                    Đã duyệt hồ sơ
                  </Badge>
                </div>}
              </div>
            </Card>
          ))}
        </div>

        {/* Cam kết kiểm định từ TutorHub */}
        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3 text-caption text-slate-700">
          <Icon name="verified_user" size="sm" className="text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-slate-900 m-0">
              Quy trình bảo chứng văn bằng tại TutorHub
            </p>
            <p className="text-[12px] text-slate-600 leading-relaxed m-0">
              Thông tin học vấn và chứng chỉ được lấy từ hồ sơ gia sư đã nộp và được xét duyệt.
            </p>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

CertificatesSection.propTypes = {
  tutor: PropTypes.shape({
    credentials: PropTypes.array,
    education: PropTypes.string,
    bio: PropTypes.string,
    university: PropTypes.string,
    major: PropTypes.string,
  }).isRequired,
  id: PropTypes.string,
};
