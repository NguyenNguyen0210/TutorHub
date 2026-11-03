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
 * ProfileAbout — Phần "Giới thiệu về tôi".
 * Thể hiện trọn vẹn câu chuyện, phong cách đào tạo và chuyên môn giảng dạy của gia sư
 * được gộp chung trong một khung gọn gàng, liền mạch.
 */
export default function ProfileAbout({ tutor }) {
  const [expanded, setExpanded] = useState(false);

  const bio = (tutor.bio || '').trim();
  const isLong = bio.length > BIO_CLAMP_CHARS;
  const visibleBio = expanded || !isLong ? bio : `${bio.slice(0, BIO_CLAMP_CHARS).trimEnd()}…`;

  const subjects = Array.isArray(tutor.subjects) ? tutor.subjects : [];

  return (
    <SectionShell id="gioi-thieu" title="Giới thiệu về tôi" icon="article">
      <Card padding="lg" className="space-y-4 shadow-sm border border-border">
        <p
          className={cn(
            'text-body-reg text-fg-secondary leading-relaxed whitespace-pre-line',
            isLong && !expanded && 'line-clamp-6'
          )}
        >
          {visibleBio || NO_BIO}
        </p>

        {isLong && (
          <div>
            <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Thu gọn' : 'Xem thêm'}
            </Button>
          </div>
        )}

        {/* Gộp chuyên môn đào tạo vào cùng khung để trang gọn gàng hơn */}
        {subjects.length > 0 && (
          <div className="pt-4 border-t border-border flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-semibold text-fg-muted flex items-center gap-1.5 mr-1">
              <Icon name="local_library" size="xs" className="text-brand-primary-600" />
              Chuyên môn đào tạo:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {subjects.map((subject, i) => (
                <Tag key={subject.id || subject.subjectId || `${subject.subjectName}-${i}`}>
                  {subject.subjectName}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </Card>
    </SectionShell>
  );
}

ProfileAbout.propTypes = {
  tutor: PropTypes.shape({
    bio: PropTypes.string,
    subjects: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        subjectId: PropTypes.string,
        subjectName: PropTypes.string,
      })
    ),
  }).isRequired,
};
