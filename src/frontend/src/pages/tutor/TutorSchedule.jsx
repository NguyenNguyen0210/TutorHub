import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import sessionService from '@/services/session.service';
import enrollmentService from '@/services/enrollment.service';
import { assertMinNotice } from '@/utils/scheduling';
import { classifyTeachingSessions, minTeachingStart, schedulingItem, teachingWeek, unscheduledGroups, validCalendarDay, vietnamDay } from '@/utils/tutorSchedule';
import { CardSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Tabs from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
import TeachingSessionCard from '@/components/tutor/TeachingSessionCard';
import TeachingWeek from '@/components/tutor/TeachingWeek';
import UnscheduledClassGroup from '@/components/tutor/UnscheduledClassGroup';

export default function TutorSchedule() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const toast = useToast();
  const activeTab = ['upcoming', 'unscheduled', 'past'].includes(params.get('tab')) ? params.get('tab') : params.get('filter') === 'unscheduled' ? 'unscheduled' : 'upcoming';
  const view = params.get('view') === 'week' ? 'week' : 'list';
  const enrollmentFilter = params.get('enrollmentId');
  const expandedGroup = params.get('group') ?? enrollmentFilter;
  const [sessions, setSessions] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(Date.now);
  const [values, setValues] = useState({});
  const [busyKey, setBusyKey] = useState(null);
  const submitting = useRef(false);
  const loadVersion = useRef(0);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  const loadData = useCallback(async () => {
    const version = ++loadVersion.current;
    setLoading(true); setError(null);
    try {
      const [calendar, contracts] = await Promise.all([sessionService.getMySessions(), enrollmentService.getAllMyEnrollments()]);
      if (version === loadVersion.current) { setSessions(calendar); setEnrollments(contracts.items); setNow(Date.now()); }
    } catch (err) { if (version === loadVersion.current) setError(err); }
    finally { if (version === loadVersion.current) setLoading(false); }
  }, []);
  useEffect(() => { loadData(); return () => { loadVersion.current += 1; }; }, [loadData]);

  const change = (changes, replace = false) => setParams(previous => {
    const next = new URLSearchParams(previous);
    Object.entries(changes).forEach(([key, value]) => value == null ? next.delete(key) : next.set(key, value));
    return next;
  }, { replace });
  const calendar = useMemo(() => classifyTeachingSessions(sessions, now), [sessions, now]);
  const allGroups = useMemo(() => unscheduledGroups(enrollments, sessions), [enrollments, sessions]);
  const groups = enrollmentFilter ? allGroups.filter(enrollment => enrollment.id === enrollmentFilter) : allGroups;
  const totalUnscheduled = allGroups.reduce((sum, enrollment) => sum + enrollment.unscheduledSessions.length, 0);
  const filteredUnscheduled = groups.reduce((sum, enrollment) => sum + enrollment.unscheduledSessions.length, 0);
  const date = validCalendarDay(params.get('date')) ? params.get('date') : vietnamDay(now);
  const week = teachingWeek(date);
  const selectedDay = week.includes(params.get('day')) ? params.get('day') : null;
  const dated = activeTab === 'past' ? calendar.past : calendar.upcoming;
  const visible = view === 'week' ? dated.filter(session => {
    const day = vietnamDay(session.startAt);
    return selectedDay ? day === selectedDay : day >= week[0] && day <= week[6];
  }) : dated;
  const returnTo = location.pathname + location.search;
  const switchTab = tab => change({ tab, filter: null });

  const save = async (key, source, duration, batch = false) => {
    if (submitting.current) return;
    let items;
    try {
      items = source.filter(session => values[session.id]).map(session => schedulingItem(session.id, values[session.id], duration));
      if (!items.length) throw new Error('Vui lòng chọn thời gian cho ít nhất một buổi học.');
      const notice = items.map(item => assertMinNotice(item.startAt)).find(Boolean);
      if (notice) throw new Error(notice);
    } catch (err) { toast.error(err.message); return; }
    submitting.current = true; setBusyKey(key);
    try {
      if (batch) await sessionService.scheduleSessionsBatch(items);
      else await sessionService.scheduleSession(items[0].sessionId, items[0].startAt, items[0].endAt);
      setValues(previous => { const next = { ...previous }; items.forEach(item => delete next[item.sessionId]); return next; });
      toast.success(`Đã xếp lịch ${items.length} buổi học.`);
      await loadData();
    } catch {
      toast.error('Chưa thể xếp lịch. Vui lòng kiểm tra thời gian trùng lịch hoặc thử lại.');
    } finally { submitting.current = false; setBusyKey(null); }
  };

  return <div className="space-y-6 lg:space-y-8">
    <WorkspacePageHeader title="Lịch giảng dạy" description="Theo dõi và sắp xếp các buổi học của bạn. Thời gian hiển thị theo giờ Việt Nam (UTC+7)." />
    {!loading && !error && <dl aria-label="Tóm tắt lịch giảng dạy" className="flex flex-wrap gap-x-8 gap-y-4 rounded-2xl border border-border bg-surface px-5 py-4 text-body-reg sm:px-6">
      <div><dt className="text-caption text-fg-secondary">Sắp tới / theo lịch hiện tại</dt><dd className="mt-1 text-2xl font-semibold text-fg">{calendar.upcoming.length} <span className="text-caption font-normal text-fg-secondary">buổi</span></dd></div>
      <div><dt className="text-caption text-fg-secondary">Chưa xếp lịch</dt><dd className="mt-1 text-2xl font-semibold text-fg">{totalUnscheduled} <span className="text-caption font-normal text-fg-secondary">buổi · {allGroups.length} lớp</span></dd></div>
      {calendar.past.length > 0 && <div><dt className="text-caption text-fg-secondary">Đã qua giờ, chưa cập nhật</dt><dd className="mt-1 text-2xl font-semibold text-holding-strong">{calendar.past.length} <span className="text-caption font-normal text-fg-secondary">buổi</span></dd></div>}
    </dl>}
    <Tabs value={activeTab} onChange={switchTab} tabs={[
      { key: 'upcoming', label: `Sắp tới (${calendar.upcoming.length})` },
      { key: 'unscheduled', label: `Cần xếp lịch (${filteredUnscheduled})` },
      ...(calendar.past.length || activeTab === 'past' ? [{ key: 'past', label: `Đã qua giờ (${calendar.past.length})` }] : []),
    ]} />
    {loading && <div aria-label="Đang tải lịch giảng dạy" role="status"><CardSkeleton count={3} /></div>}
    {!loading && error && <ErrorState error={error} title="Chưa tải được lịch giảng dạy" onRetry={loadData} />}
    {!loading && !error && activeTab !== 'unscheduled' && <>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-[18px] font-semibold text-fg">{activeTab === 'past' ? 'Buổi học cần cập nhật' : 'Các buổi dạy của bạn'}</h2><div aria-label="Chế độ xem lịch" className="flex gap-1 rounded-xl border border-border bg-surface p-1">{[['list', 'Danh sách'], ['week', 'Theo tuần']].map(([key, label]) => <Button key={key} variant={view === key ? 'primary' : 'ghost'} aria-pressed={view === key} onClick={() => change({ view: key, day: null })}>{label}</Button>)}</div></div>
      {activeTab === 'past' && <p className="text-body-reg text-fg-secondary">Các buổi đã qua giờ kết thúc nhưng chưa được ghi nhận hoàn thành. Mở chi tiết để kiểm tra và cập nhật.</p>}
      {view === 'week' && <TeachingWeek date={date} day={selectedDay} sessions={dated} onChange={changes => change(changes)} />}
      {selectedDay && view === 'week' && <div className="flex flex-wrap items-center gap-3"><p className="text-caption text-fg-secondary">Đang xem ngày {selectedDay.split('-').reverse().join('/')}</p><Button size="sm" variant="ghost" onClick={() => change({ day: null })}>Xem cả tuần</Button></div>}
      {visible.length ? <ul className="space-y-4">{visible.map(session => <li key={session.id}><TeachingSessionCard session={session} now={now} returnTo={returnTo} past={activeTab === 'past'} /></li>)}</ul>
        : <EmptyState icon="calendar_month" title={view === 'week' ? 'Không có buổi học trong khoảng thời gian này' : activeTab === 'past' ? 'Không có buổi học cần cập nhật' : 'Bạn chưa có lịch dạy sắp tới'} description={view === 'week' ? 'Chọn tuần khác hoặc xem danh sách tất cả buổi học.' : 'Các buổi học sau khi được xếp lịch sẽ xuất hiện tại đây.'} actionLabel={view === 'week' ? 'Xem danh sách' : totalUnscheduled ? 'Xem các buổi cần xếp lịch' : undefined} onAction={() => view === 'week' ? change({ view: 'list', day: null }) : switchTab('unscheduled')} className="max-w-none rounded-2xl shadow-none" />}
    </>}
    {!loading && !error && activeTab === 'unscheduled' && <section aria-labelledby="unscheduled-title" className="space-y-5">
      <div><h2 id="unscheduled-title" className="text-[18px] font-semibold text-fg">Buổi học cần xếp lịch</h2><p className="mt-2 text-body-reg leading-relaxed text-fg-secondary">Nhóm theo học viên và hợp đồng. Chọn một lớp để xem các buổi chưa có lịch.</p></div>
      {enrollmentFilter && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4"><p className="text-caption text-fg-secondary">Đang xem các buổi chưa xếp lịch của lớp đã chọn.</p><Button size="sm" variant="ghost" onClick={() => change({ enrollmentId: null, group: null })}>Xem tất cả lớp</Button></div>}
      <p className="flex items-start gap-2 rounded-xl bg-brand-primary-50 p-4 text-caption leading-relaxed text-fg-secondary"><Icon name="info" size="sm" className="mt-0.5 shrink-0 text-primary" />Xếp lịch trước giờ bắt đầu ít nhất 2 giờ. Không cần xếp tất cả buổi cùng lúc. Giờ nhập theo Việt Nam (UTC+7).</p>
      {groups.length ? groups.map(enrollment => <UnscheduledClassGroup key={enrollment.id} enrollment={enrollment} open={expandedGroup === enrollment.id} onToggle={open => change({ group: open ? enrollment.id : '' }, true)}
        values={values} min={minTeachingStart(now)} busy={Boolean(busyKey)} busyKey={busyKey} returnTo={returnTo}
        onChange={(id, value) => setValues(previous => ({ ...previous, [id]: value }))}
        onSingle={(session, duration) => save(session.id, [session], duration)}
        onBatch={item => save(item.id, item.unscheduledSessions, item.sessionDurationMinutes, true)} />)
        : <EmptyState icon="calendar_month" title={enrollmentFilter ? 'Không có buổi cần xếp lịch trong lớp này' : 'Không có buổi học nào cần xếp lịch'} description="Các lớp có buổi học chưa được lên lịch sẽ hiển thị tại đây." className="max-w-none rounded-2xl shadow-none" />}
    </section>}
  </div>;
}
