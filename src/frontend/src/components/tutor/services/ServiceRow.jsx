import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Money from '@/components/ui/Money';
import Badge, { Tag } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { Menu } from '@/components/ui/Avatar';
import { getTeachingModeMeta } from '@/config/enums';

export function ServiceStatusBadge({ status }) {
  switch (status) {
    case 'Published':
      return <Badge variant="success" size="sm" dot>Đã xuất bản</Badge>;
    case 'Draft':
      return <Badge variant="holding" size="sm" dot>Bản nháp</Badge>;
    case 'Paused':
      return <Badge variant="secondary" size="sm" dot>Tạm dừng</Badge>;
    case 'Unpublished':
      return <Badge variant="neutral" size="sm" dot>Đã ẩn</Badge>;
    default:
      return <Badge variant="neutral" size="sm" dot>{status}</Badge>;
  }
}

ServiceStatusBadge.propTypes = {
  status: PropTypes.string,
};

function ServiceThumb({ title, subjectName, coverImageUrl }) {
  if (coverImageUrl) {
    return (
      <img
        src={coverImageUrl}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="w-full h-36 sm:h-full sm:min-h-[168px] object-cover rounded-brand-md pointer-events-none select-none"
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className="w-full h-36 sm:h-full sm:min-h-[168px] rounded-brand-md bg-brand-primary-50 border border-brand-primary-100 flex flex-col items-center justify-center gap-1 p-3 text-center select-none"
    >
      <span className="text-headline-3 font-bold text-brand-primary-700 leading-tight line-clamp-2">
        {subjectName || 'Gia sư'}
      </span>
      <span className="text-caption font-medium text-brand-primary-600 line-clamp-1">
        {(title || '').split(' ').slice(0, 3).join(' ')}
      </span>
    </div>
  );
}

ServiceThumb.propTypes = {
  title: PropTypes.string,
  subjectName: PropTypes.string,
  coverImageUrl: PropTypes.string,
};

const SPINE_CLASS = {
  Published: 'bg-brand-primary-500',
  Draft: 'bg-brand-secondary-500',
  Paused: 'bg-neutral-300',
  Unpublished: 'bg-neutral-200',
};

const META_ICON_CLASS = 'w-4 h-4 text-fg-muted shrink-0';

/**
 * ServiceRow — một gói dịch vụ dạng catalogue (số lot · thumbnail · nội dung · giá/hành động).
 * Mobile tự xếp chồng dọc theo UX guideline "table -> card".
 */
export default function ServiceRow({ pkg, index = 0, isActing, onEdit, onPublish, onUnpublish }) {
  const modeMeta = getTeachingModeMeta(pkg.teachingMode);
  const pricePerSession =
    pkg.totalSessions > 0 ? Math.round(pkg.price / pkg.totalSessions) : pkg.price;
  const detailHref = `/services/${pkg.id}`;
  const isPublished = pkg.status === 'Published';
  const lotNumber = String(index + 1).padStart(2, '0');

  const menuItems = isPublished
    ? [
        {
          key: 'view',
          icon: <Icon name="open_in_new" size="sm" />,
          label: 'Mở trang công khai',
          onClick: () => window.open(detailHref, '_blank', 'noopener,noreferrer'),
        },
        { type: 'divider' },
        {
          key: 'unpublish',
          icon: <Icon name="visibility_off" size="sm" />,
          label: 'Tạm ẩn gói',
          danger: true,
          onClick: () => onUnpublish(pkg),
        },
      ]
    : [
        {
          key: 'view',
          icon: <Icon name="visibility" size="sm" />,
          label: 'Xem trước trang công khai',
          onClick: () => window.open(detailHref, '_blank', 'noopener,noreferrer'),
        },
        {
          key: 'publish',
          icon: <Icon name="rocket_launch" size="sm" />,
          label: 'Xuất bản ngay',
          onClick: () => onPublish(pkg),
        },
      ];

  return (
    <article className="group relative bg-surface border border-border rounded-brand-lg shadow-brand-sm hover:shadow-brand-md hover:-translate-y-0.5 transition-all overflow-hidden">
      {/* Status spine */}
      <span
        aria-hidden="true"
        className={`absolute left-0 top-0 bottom-0 w-1 ${SPINE_CLASS[pkg.status] || 'bg-neutral-200'}`}
      />

      <div className="p-4 sm:p-5 sm:pl-6 flex flex-col sm:grid sm:grid-cols-[auto_176px_minmax(0,1fr)_196px] gap-4 sm:gap-5">
        {/* Lot number */}
        <div aria-hidden="true" className="hidden sm:flex items-start justify-center pt-1 select-none">
          <span className="text-[34px] leading-none font-bold tabular-nums text-neutral-200 group-hover:text-brand-primary-200 transition-colors">
            {lotNumber}
          </span>
        </div>

        <div className="shrink-0">
          <ServiceThumb
            title={pkg.title}
            subjectName={pkg.subjectName}
            coverImageUrl={pkg.coverImageUrl}
          />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start gap-2 flex-wrap">
            <h2 className="text-[16px] font-bold text-fg leading-snug flex-1 min-w-[180px]" title={pkg.title}>
              <Link to={detailHref} target="_blank" rel="noopener noreferrer" className="hover:text-brand-primary-600 transition-colors">
                {pkg.title}
              </Link>
            </h2>
            <ServiceStatusBadge status={pkg.status} />
          </div>

          {(pkg.subjectName || pkg.gradeName || (Array.isArray(pkg.tags) && pkg.tags.length > 0)) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {pkg.subjectName && <Tag>{pkg.subjectName}</Tag>}
              {pkg.gradeName && <Tag>{pkg.gradeName}</Tag>}
              {Array.isArray(pkg.tags) && pkg.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          )}

          <p className="text-caption text-fg-secondary line-clamp-2 leading-relaxed">
            {pkg.description}
          </p>

          <ul className="flex items-center gap-x-4 gap-y-1.5 flex-wrap text-caption text-fg-secondary pt-1" aria-label="Thông số gói học">
            <li className="inline-flex items-center gap-1.5">
              <Icon name="calendar_month" size="xs" className={META_ICON_CLASS} />
              {pkg.totalSessions} buổi
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Icon name="schedule" size="xs" className={META_ICON_CLASS} />
              {pkg.sessionDurationMinutes} phút/buổi
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Icon name="location_on" size="xs" className={META_ICON_CLASS} />
              {modeMeta.label}
            </li>
            {pkg.studentCount != null && (
              <li className="inline-flex items-center gap-1.5">
                <Icon name="group" size="xs" className={META_ICON_CLASS} />
                {pkg.studentCount} học viên
              </li>
            )}
            <li className="inline-flex items-center gap-1.5">
              {pkg.averageRating != null ? (
                <>
                  <Icon name="star" size="xs" filled className="w-4 h-4 text-amber-500 shrink-0" />
                  {Number(pkg.averageRating).toFixed(1)} ({pkg.reviewCount ?? 0})
                </>
              ) : (
                <>
                  <Icon name="star" size="xs" className={META_ICON_CLASS} />
                  —
                </>
              )}
            </li>
            {pkg.trialLessonUrl && (
              <li className="inline-flex items-center gap-1.5 text-brand-primary-700 font-medium">
                <Icon name="play_circle" size="xs" className="w-4 h-4 shrink-0" />
                Có video học thử
              </li>
            )}
          </ul>
        </div>

        <div className="shrink-0 flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-3 sm:border-l sm:border-border sm:pl-5">
          <div className="sm:text-right">
            <p className="text-[22px] font-bold text-fg tabular-nums tracking-tight leading-none">
              <Money value={pkg.price} />
            </p>
            <p className="text-caption text-fg-secondary mt-1.5 tabular-nums">
              {pricePerSession.toLocaleString('vi-VN')} ₫/buổi · {pkg.totalSessions} buổi
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:mt-auto sm:pt-2">
            {isPublished ? (
              <Button
                as={Link}
                to={detailHref}
                target="_blank"
                rel="noopener noreferrer"
                variant="ghost"
                size="sm"
                icon={<Icon name="visibility" size="xs" />}
              >
                Xem
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                loading={isActing}
                onClick={() => onPublish(pkg)}
                icon={<Icon name="rocket_launch" size="xs" />}
              >
                Xuất bản
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(pkg)}
              icon={<Icon name="edit" size="xs" />}
            >
              Chỉnh sửa
            </Button>
            <Menu
              trigger={(
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Thao tác khác cho ${pkg.title}`}
                  title="Thao tác khác"
                  className="w-8 h-8 rounded-brand-md inline-flex items-center justify-center text-fg-secondary hover:bg-neutral-100 hover:text-fg transition-colors cursor-pointer"
                >
                  <Icon name="more_vert" size="sm" />
                </span>
              )}
              items={menuItems}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

ServiceRow.propTypes = {
  pkg: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    subjectName: PropTypes.string,
    gradeName: PropTypes.string,
    coverImageUrl: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    studentCount: PropTypes.number,
    averageRating: PropTypes.number,
    reviewCount: PropTypes.number,
    status: PropTypes.string,
    totalSessions: PropTypes.number,
    sessionDurationMinutes: PropTypes.number,
    price: PropTypes.number,
    teachingMode: PropTypes.string,
    trialLessonUrl: PropTypes.string,
  }).isRequired,
  index: PropTypes.number,
  isActing: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onPublish: PropTypes.func.isRequired,
  onUnpublish: PropTypes.func.isRequired,
};
