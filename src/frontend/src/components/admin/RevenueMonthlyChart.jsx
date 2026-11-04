import React, { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import Money from '@/components/ui/Money';
import { formatCurrency } from '@/utils/formatters';
import { compactRevenue, revenueMonthLabel, revenueMonthLink, revenueNumber, revenueScale } from '@/utils/revenuePresentation';

export default function RevenueMonthlyChart({ points, currentMonth }) {
  const [active, setActive] = useState(null);
  const viewport = useRef(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => setAvailableWidth(Math.floor(entry.contentRect.width)));
    if (viewport.current) observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  const width = Math.max(560, points.length * 76 + 96, availableWidth);
  useLayoutEffect(() => {
    // On small screens start at the newest months; the full reporting period remains scrollable.
    if (viewport.current) viewport.current.scrollLeft = viewport.current.scrollWidth;
  }, [width, currentMonth]);
  const left = 96; const top = 24; const height = 208; const bottom = top + height;
  const plotWidth = width - left - 20;
  const column = plotWidth / points.length;
  const scale = revenueScale(points);
  const y = value => top + (scale.max - value) / (scale.max - scale.min) * height;
  const baseline = y(0);
  const tickCandidates = scale.ticks.length === 1 ? scale.ticks : [0, scale.max, scale.min, ...scale.ticks];
  const visibleTicks = tickCandidates.reduce((ticks, tick) => ticks.every(previous => Math.abs(y(previous) - y(tick)) >= 18) ? [...ticks, tick] : ticks, []);
  const focused = active == null ? null : points[active];
  const tooltipX = active == null ? 0 : Math.max(120, Math.min(width - 120, left + column * (active + 0.5)));
  return <div ref={viewport} className="overflow-x-auto rounded-xl border border-border bg-neutral-50/50 p-2">
    <div className="relative" style={{ width }}>
      <svg viewBox={`0 0 ${width} ${bottom + 42}`} className="block w-full" aria-label="Doanh thu phí thuần theo tháng" role="group">
        {visibleTicks.map(tick => <g key={tick} aria-hidden="true"><line x1={left} x2={width - 20} y1={y(tick)} y2={y(tick)} className={tick === 0 ? 'stroke-neutral-300' : 'stroke-neutral-200'} strokeDasharray={tick === 0 ? undefined : '3 5'} /><text x={left - 12} y={y(tick) + 4} textAnchor="end" className="fill-fg-secondary text-[10px]">{compactRevenue(tick)}</text></g>)}
        {points.map((point, index) => {
          const number = revenueNumber(point.platformRevenue);
          const x = left + column * index;
          const center = x + column / 2;
          const link = revenueMonthLink(point.month);
          const current = point.month === currentMonth;
          const tone = number < 0 ? 'fill-insight-strong' : current ? 'fill-brand-primary-600' : 'fill-brand-primary-300';
          const content = <>
            {current && <rect x={x + 3} y={top - 8} width={column - 6} height={height + 16} rx={8} className="fill-brand-primary-50" />}
            <rect x={x + 2} y={top - 8} width={column - 4} height={height + 45} rx={8} className="fill-transparent" />
            {number == null ? <text x={center} y={baseline - 10} textAnchor="middle" className="fill-fg-secondary text-xs">—</text> : number === 0 ? <circle cx={center} cy={baseline} r={3} className="fill-neutral-400" /> : <rect x={center - Math.min(40, column * 0.5) / 2} y={Math.min(y(number), baseline)} width={Math.min(40, column * 0.5)} height={Math.abs(y(number) - baseline)} rx={4} className={tone} />}
            <text x={center} y={bottom + 30} textAnchor="middle" className={cn('text-[11px]', current ? 'fill-brand-primary-700 font-semibold' : 'fill-fg-secondary')}>{revenueMonthLabel(point.month)}</text>
          </>;
          return link ? <Link key={point.month} to={link} onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(index)} onBlur={() => setActive(null)} aria-label={`${revenueMonthLabel(point.month)}: ${number == null ? 'chưa có dữ liệu' : formatCurrency(number)}. Xem giao dịch trong tháng.`} aria-describedby={active === index ? 'revenue-month-tooltip' : undefined} className="rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary-600">{content}</Link> : <g key={index}>{content}</g>;
        })}
      </svg>
      {focused && <div id="revenue-month-tooltip" role="tooltip" className="pointer-events-none absolute top-3 z-10 w-56 -translate-x-1/2 rounded-xl border border-border bg-surface p-3 text-xs shadow-brand-md" style={{ left: `${tooltipX / width * 100}%` }}>
        <p className="font-semibold">{revenueMonthLabel(focused.month)}{focused.month === currentMonth && <span className="ml-2 font-normal text-brand-primary-600">Đang diễn ra</span>}</p>
        <p className="mt-2 text-fg-secondary">Doanh thu phí thuần</p><p className="mt-1 text-base font-semibold">{revenueNumber(focused.platformRevenue) == null ? '—' : <Money value={focused.platformRevenue} />}</p>
        <p className="mt-2 text-fg-secondary">Đơn tạo trong tháng đã thanh toán: <strong className="font-medium text-fg">{revenueNumber(focused.paidBookings) ?? '—'}</strong></p>
        <p className="mt-2 text-fg-secondary">Nhấn để xem khoản thu, chi trong tháng.</p>
      </div>}
    </div>
  </div>;
}
