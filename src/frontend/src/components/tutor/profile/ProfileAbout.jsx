import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';
import Card from '@/components/ui/Card';
import { Tag } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { SectionShell } from './SectionShell';

const BIO_CLAMP_CHARS = 420;

const NO_BIO = 'Chưa có thông tin giới thiệu chi tiết từ gia sư.';

/**
 * ProfileAbout — phần "Giới thiệu về tôi" + môn học + 3 lớp bảo chứng (SPEC §4.4).
 *
 * "Điểm mạnh giảng dạy" chỉ hiện những gì suy ra được từ dữ liệu thật
 * (học vấn + số năm + môn đang dạy). Không có dữ liệu thì ẩn hẳn khối, không
 * dựng câu chữ bịa (SPEC §6.4).
 */
export default function ProfileAbout({ tutor }) {
  const [expanded, setExpanded] = useState(false);

  const bio = (tutor.bio || '').trim();
  const isLong = bio.length > BIO_CLAMP_CHARS;
  const visibleBio = expanded || !isLong ? bio : `${bio.slice(0, BIO_CLAMP_CHARS).trimEnd()}…`;

  const subjects = Array.isArray(tutor.subjects) ? tutor.subjects : [];
  const modeMeta = tutor.teachingMode || null;

  const strengths = [];
  if (tutor.education) {
    strengths.push({ icon: 'school', text: `Đào tạo nền: ${tutor.education}` });
  }
  if (tutor.experienceYears > 0) {
    strengths.push({
      icon: 'history_edu',
      text: `${tutor.experienceYears} năm kinh nghiệm giảng dạy thực chiến`,
    });
  }
  if (subjects.length > 0) {
    strengths.push({
      icon: 'menu_book',
      text: `Đang giảng dạy: ${subjects.map((s) => s.subjectName).filter(Boolean).join(', ')}`,
    });
  }
  if (modeMeta === 'Both') {
    strengths.push({ icon: 'videocam', text: 'Linh hoạt cả học online và tại nhà học viên' });
  }

  return (
    <>
      <SectionShell id="gioi-thieu" title="Giới thiệu về tôi" icon="article">
        <Card padding="lg" className="space-y-4">
          <p
            className={cn(
              'text-body-reg text-fg-secondary leading-relaxed whitespace-pre-line',
              isLong && !expanded && 'line-clamp-6'
            )}
          >
            {visibleBio || NO_BIO}
          </p>

          {isLong && (
            <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Thu gọn' : 'Xem thêm'}
            </Button>
          )}

          {strengths.length > 0 && (
            <div className="p-4 rounded-brand-lg bg-brand-primary-50/70 border border-brand-primary-100">
              <p className="text-caption font-bold text-fg mb-2.5 flex items-center gap-1.5">
                <Icon name="psychology" size="xs" className="text-brand-primary-600" />
                Điểm mạnh giảng dạy
              </p>
              <ul className="space-y-2">
                {strengths.map((s) => (
                  <li key={s.text} className="flex items-start gap-2 text-caption text-fg-secondary">
                    <Icon
                      name={s.icon}
                      size="xs"
                      className="text-brand-primary-600 shrink-0 mt-0.5"
                    />
                    <span className="min-w-0">{s.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </SectionShell>

      {subjects.length > 0 && (
        <SectionShell
          id="mon-hoc"
          title="Môn học & chuyên môn"
          icon="menu_book"
          className="mt-8"
        >
          <div className="flex flex-wrap gap-1.5">
            {subjects.map((subject, i) => (
              <Tag key={subject.id || subject.subjectId || `${subject.subjectName}-${i}`}>
                {subject.subjectName}
              </Tag>
            ))}
          </div>
        </SectionShell>
      )}
    </>
  );
}

ProfileAbout.propTypes = {
  tutor: PropTypes.shape({
    bio: PropTypes.string,
    education: PropTypes.string,
    experienceYears: PropTypes.number,
    teachingMode: PropTypes.string,
    subjects: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        subjectId: PropTypes.string,
        subjectName: PropTypes.string,
      })
    ),
  }).isRequired,
};
