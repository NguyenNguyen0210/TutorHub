import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Money from '@/components/ui/Money';
import Badge, { Tag } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { Menu } from '@/components/ui/Avatar';
import { getTeachingModeMeta } from '@/config/enums';
import { formatRelativeTime } from '@/utils/formatters';

export function ServiceStatusBadge({ status }) {
  switch (status) {
    case 'Published':
      return <Badge variant="success" size="sm" dot>Đã xuất bản</Badge>;
    case 'Draft':
      return <Badge variant="holding" size="sm" dot>Bản nháp</Badge>;
    case 'Paused':
      return <Badge variant="secondary" size="sm" dot>Tạm dừng</Badge>;
    case 'Unpublished':
      return <Badge variant="neutral" size="sm" dot>Đã gỡ xuất bản</Badge>;
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
        className="w-full h-36 sm:h-full sm:min-h-[148px] object-cover rounded-brand-md pointer-events-none select-none"
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className="w-full h-36 sm:h-full sm:min-h-[148px] rounded-brand-md bg-brand-primary-50 border border-brand-primary-100 flex flex-col items-center justify-center gap-1 p-3 text-center select-none"
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

/**
 * ServiceRow — một gói dịch vụ dạng hàng ngang (thumbnail · nội dung · giá/hành động).
 * Cột phải dành hoàn toàn cho commercial info + action; status pill nằm cạnh title.
 * Mobile tự xếp chồng dọc theo UX guideline "table -> card".
 */
export default function ServiceRow({
  pkg,
  isActing,
  onEdit,
  onPublish,
  onUnpublish,
  onPause,
  onResume,
}) {
  const modeMeta = getTeachingModeMeta(pkg.teachingMode);
  const pricePerSession =
    pkg.totalSessions > 0 ? Math.round(pkg.price / pkg.totalSessions) : pkg.price;
  const detailHref = `/services/${pkg.id}`;
  const updatedLabel = pkg.updatedAt || pkg.createdAt
    ? `Cập nhật ${formatRelativeTime(pkg.updatedAt || pkg.createdAt)}`
    : null;

  const openPublic = () => window.open(detailHref, '_blank', 'noopener,noreferrer');

  const menuItems =
    pkg.status === 'Published'
      ? [
          { key: 'view', icon: <Icon name="open_in_new" size="sm" />, label: 'Mở trang công khai', onClick: openPublic },
          {
            key: 'pause',
            icon: <Icon name="hourglass_top" size="sm" />,
            label: 'Tạm dừng tuyển sinh',
            onClick: () => onPause?.(pkg),
          },
          { type: 'divider' },
          {
            key: 'unpublish',
            icon: <Icon name="visibility_off" size="sm" />,
            label: 'Gỡ xuất bản',
            danger: true,
            onClick: () => onUnpublish(pkg),
          },
        ]
      : pkg.status === 'Paused'
        ? [
            { key: 'view', icon: <Icon name="visibility" size="sm" />, label: 'Xem trước trang công khai', onClick: openPublic },
            {
              key: 'unpublish',
              icon: <Icon name="visibility_off" size="sm" />,
              label: 'Gỡ xuất bản',
              danger: true,
              onClick: () => onUnpublish(pkg),
            },
          ]
        : [
            { key: 'view', icon: <Icon name="visibility" size="sm" />, label: 'Xem trước trang công khai', onClick: openPublic },
          ];

  const renderActions = () => {
    const editBtn = (
      <Button
        variant="outline"
        size="sm"
        onClick={() => onEdit(pkg)}
        icon={<Icon name="edit" size="xs" />}
        className="whitespace-nowrap"
      >
        Chỉnh sửa
      </Button>
    );
    const moreBtn = (pkg.status === 'Published' || pkg.status === 'Paused' || pkg.status === 'Unpublished') && (
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
    );

    switch (pkg.status) {
      case 'Published':
        return (
          <>
            <Button
              as={Link}
              to={detailHref}
              target="_blank"
              rel="noopener noreferrer"
              variant="ghost"
              size="sm"
              icon={<Icon name="visibility" size="xs" />}
              className="whitespace-nowrap"
            >
              Xem
            </Button>
            {editBtn}
            {moreBtn}
          </>
        );
      case 'Paused':
        return (
          <>
            {editBtn}
            <Button
              variant="primary"
              size="sm"
              loading={isActing}
              onClick={() => onResume?.(pkg)}
              icon={<Icon name="play_circle" size="xs" />}
              className="whitespace-nowrap"
            >
              Tiếp tục
            </Button>
            {moreBtn}
          </>
        );
      case 'Unpublished':
        return (
          <>
            {editBtn}
            <Button
              variant="primary"
              size="sm"
              loading={isActing}
              onClick={() => onPublish(pkg)}
              icon={<Icon name="rocket_launch" size="xs" />}
              className="whitespace-nowrap"
            >
              Xuất bản lại
            </Button>
            {moreBtn}
          </>
        );
      default:
        return (
          <>
            {editBtn}
            <Button
              variant="primary"
              size="sm"
              loading={isActing}
              onClick={() => onPublish(pkg)}
              icon={<Icon name="rocket_launch" size="xs" />}
              className="whitespace-nowrap"
            >
              Xuất bản
            </Button>
          </>
        );
    }
  };

  return (
    <article className="bg-surface border border-border rounded-brand-lg shadow-brand-sm hover:shadow-brand-md transition-shadow p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
      <div className="sm:w-44 shrink-0">
        <ServiceThumb
          title={pkg.title}
          subjectName={pkg.subjectName}
          coverImageUrl={pkg.coverImageUrl}
        />
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start gap-2 flex-wrap">
          <h2 className="text-[16px] font-semibold text-fg leading-snug flex-1 min-w-[180px]" title={pkg.title}>
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

        <p className="text-[13px] text-fg-secondary leading-relaxed">
          {pkg.totalSessions} buổi · {pkg.sessionDurationMinutes} phút/buổi
        </p>
        <p className="text-[13px] text-fg-secondary leading-relaxed">
          {modeMeta.label}
          {pkg.studentCount != null && ` · ${pkg.studentCount} học viên`}
          {pkg.averageRating != null && ` · ${Number(pkg.averageRating).toFixed(1)}★ (${pkg.reviewCount ?? 0})`}
          {pkg.trialLessonUrl && ' · Có video học thử'}
        </p>
        {updatedLabel && (
          <p className="text-[12px] text-fg-muted">{updatedLabel}</p>
        )}
      </div>

      <div className="shrink-0 flex sm:flex-col items-end sm:items-end justify-between sm:justify-start gap-3 sm:w-48 sm:text-right sm:border-l sm:border-border sm:pl-4">
        <div>
          <p className="text-[20px] font-bold text-fg tabular-nums tracking-tight leading-none">
            <Money value={pkg.price} />
          </p>
          <p className="text-[13px] text-fg-secondary mt-1.5">
            Gói {pkg.totalSessions} buổi
          </p>
          <p className="text-[12px] text-fg-muted tabular-nums">
            ≈ {pricePerSession.toLocaleString('vi-VN')}đ/buổi
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:mt-auto sm:pt-2">
          {renderActions()}
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
    updatedAt: PropTypes.string,
    createdAt: PropTypes.string,
  }).isRequired,
  isActing: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onPublish: PropTypes.func.isRequired,
  onUnpublish: PropTypes.func.isRequired,
  onPause: PropTypes.func,
  onResume: PropTypes.func,
};

ServiceRow.defaultProps = {
  onPause: undefined,
  onResume: undefined,
};
