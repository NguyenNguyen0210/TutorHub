import { resolveServiceCover } from '@/utils/serviceCover';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBlocker, useLocation, useNavigate, useParams } from 'react-router-dom';
import tutorService from '@/services/tutor.service';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
import { DetailSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import Money from '@/components/ui/Money';
import Input, { Field, Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/Dialog';
import { ServiceStatusBadge } from '@/components/tutor/services/ServiceRow';
import { BasicInfoFields, ScopeOutcomeFields } from '@/components/tutor/services/ServiceFormSections';
import { buildServicePayload, parseTags, splitLines } from '@/components/tutor/services/serviceFormUtils';
import { serviceListingReturn, serviceToForm } from '@/utils/tutorServiceManagement';
import { EDITOR_SECTIONS, validateServiceEditor } from '@/utils/serviceEditor';
import ChipEditor from '@/components/tutor/services/editor/ChipEditor';
import EditorMediaFields from '@/components/tutor/services/editor/EditorMediaFields';
import CurriculumEditor from '@/components/tutor/services/editor/CurriculumEditor';
import FaqEditor from '@/components/tutor/services/editor/FaqEditor';
import ServiceEditorPreview from '@/components/tutor/services/editor/ServiceEditorPreview';
import { cn } from '@/lib/cn';

export default function ServiceEdit() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const returnTo = serviceListingReturn(location.state);
  const [service, setService] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [validation, setValidation] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [activeSection, setActiveSection] = useState('basics');
  const submitting = useRef(false);
  const coverUpload = useRef(null);
  const requestVersion = useRef(0);
  const asking = useRef(false);
  const initialForm = useMemo(() => service ? serviceToForm(service) : null, [service]);
  const dirty = Boolean(form && initialForm && JSON.stringify(form) !== JSON.stringify(initialForm));
  const blocker = useBlocker(({ currentLocation, nextLocation }) => (dirty || saving) && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (blocker.state !== 'blocked' || asking.current) return;
    if (submitting.current) { blocker.reset(); return; }
    asking.current = true;
    confirm({ title: 'Rời trang khi chưa lưu?', content: 'Các thay đổi trong gói học này chưa được lưu.', confirmText: 'Bỏ thay đổi', cancelText: 'Ở lại chỉnh sửa' }).then(leave => {
      if (leave) blocker.proceed(); else blocker.reset();
    }).finally(() => { asking.current = false; });
  }, [blocker, confirm]);
  useEffect(() => {
    if (!dirty && !saving) return undefined;
    const guard = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty, saving]);
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true); setError(null);
    try {
      const result = await tutorService.getMyServiceById(id);
      if (version !== requestVersion.current) return;
      coverUpload.current = null;
      setService(result); setForm(serviceToForm(result)); setSaved(false); setSaveError(''); setValidation(null);
    } catch (err) { if (version === requestVersion.current) setError(err); }
    finally { if (version === requestVersion.current) setLoading(false); }
  }, [id]);
  useEffect(() => { load(); return () => { requestVersion.current += 1; }; }, [load]);
  useEffect(() => {
    if (loading || error) return undefined;
    let frame;
    const track = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let current = 'basics';
        const offset = window.innerWidth < 1024 ? 160 : 48;
        EDITOR_SECTIONS.forEach(([key]) => { if (document.getElementById(`editor-${key}`)?.getBoundingClientRect().top <= offset) current = key; });
        if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 3) current = 'faq';
        setActiveSection(current);
      });
    };
    track();
    window.addEventListener('scroll', track, { passive: true });
    window.addEventListener('resize', track);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', track); window.removeEventListener('resize', track); };
  }, [loading, error]);
  useEffect(() => {
    if (!validation) return undefined;
    setActiveSection(validation.section);
    document.getElementById(`editor-${validation.section}`)?.scrollIntoView({ block: 'start', behavior: 'instant' });
    const frame = requestAnimationFrame(() => {
      const field = document.getElementById(validation.fieldId);
      field?.scrollIntoView({ block: 'center', behavior: 'instant' }); field?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [validation]);
  const goBack = () => navigate(returnTo.path, { replace: true, state: returnTo.key ? { restoreScrollKey: returnTo.key } : undefined });
  const jump = key => { setActiveSection(key); document.getElementById(`editor-${key}`)?.scrollIntoView({ behavior: 'instant', block: 'start' }); };
  const changeField = (field, value) => { setForm(previous => ({ ...previous, [field]: value })); setSaved(false); setSaveError(''); setValidation(null); };
  const save = async event => {
    event.preventDefault();
    if (submitting.current || !dirty) return;
    const invalid = validateServiceEditor(form, service);
    if (invalid) { setValidation(invalid); return; }
    submitting.current = true; setSaving(true); setSaveError('');
    const version = requestVersion.current;
    try {
      const coverImageUrl = await resolveServiceCover(form, coverUpload);
      const updated = await tutorService.updateService(id, buildServicePayload({ ...form, coverImageUrl }, { mode: 'update', lockCommercialTerms: service.status === 'Published' }));
      if (version !== requestVersion.current) return;
      setService(updated); setForm(serviceToForm(updated)); setSaved(true); setValidation(null);
      toast.success('Đã lưu thay đổi gói học.');
    } catch (err) {
      if (version === requestVersion.current) setSaveError(err?.status === 409 ? 'Trạng thái gói đã thay đổi. Kiểm tra trạng thái tuyển sinh trước khi chỉnh sửa điều khoản.' : 'Chưa lưu được gói học. Nội dung bạn nhập vẫn được giữ lại. Vui lòng thử lại.');
    } finally { submitting.current = false; setSaving(false); }
  };

  if (loading) return <div role="status" aria-label="Đang tải gói học"><DetailSkeleton /></div>;
  if (error || !service || !form) return <ErrorState title="Chưa mở được gói học" error={error} onRetry={load} backPath={returnTo.path} backLabel="Về gói học của tôi" />;
  const locked = service.status === 'Published';
  const fields = { formData: form, onFieldChange: changeField };
  const section = (key, content) => <Card as="section" id={`editor-${key}`} key={key} padding="lg" variant="outlined" className={cn('scroll-mt-32 space-y-5 rounded-2xl lg:scroll-mt-6', validation?.section === key && 'border-danger/50')} aria-labelledby={`${key}-heading`}>
    <h2 id={`${key}-heading`} tabIndex={-1} className="text-lg font-semibold text-fg">{EDITOR_SECTIONS.find(item => item[0] === key)[1]}</h2>
    {validation?.section === key && <p role="alert" className="rounded-lg bg-danger-subtle p-3 text-body-reg text-danger-strong">{validation.message}</p>}{content}
  </Card>;
  return <div className="space-y-6 pb-6">
    <Button variant="ghost" onClick={goBack} disabled={saving} icon={<Icon name="arrow_back" size="sm" />}>Về gói học của tôi</Button>
    <WorkspacePageHeader title="Chỉnh sửa gói học" description={service.title} actions={<Button variant="outline" onClick={() => setPreview(true)} disabled={saving} icon={<Icon name="visibility" size="sm" />}>Xem trước</Button>} />
    <div className="flex flex-wrap items-center gap-3"><ServiceStatusBadge status={service.status} /><p className="text-caption text-fg-secondary">Hợp đồng đã ký giữ nguyên học phí, số buổi và thời lượng.</p></div>
    {locked && <p className="rounded-xl bg-brand-primary-50 p-4 text-body-reg text-fg-secondary">Bạn có thể sửa nội dung giảng dạy. Những mục ghi Chỉ đọc cần tạm dừng tuyển sinh hoặc gỡ xuất bản trước khi sửa. <button type="button" onClick={() => jump('terms')} className="font-medium text-primary underline">Tìm hiểu cách chỉnh sửa điều khoản</button></p>}
    <form onSubmit={save} noValidate>
      <div className="grid items-start gap-6 lg:grid-cols-[188px_minmax(0,1fr)]">
        <nav aria-label="Các phần chỉnh sửa gói học" className="sticky top-16 z-30 rounded-xl border border-border bg-surface p-3 lg:top-6">
          <label htmlFor="editor-section" className="sr-only">Đi tới phần chỉnh sửa</label><Select id="editor-section" value={activeSection} onChange={event => jump(event.target.value)} className="lg:hidden">{EDITOR_SECTIONS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select>
          <ul className="hidden space-y-1 lg:block">{EDITOR_SECTIONS.map(([key, label]) => <li key={key}><button type="button" aria-current={activeSection === key ? 'location' : undefined} onClick={() => jump(key)} className={cn('min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', activeSection === key ? 'bg-brand-primary-50 text-primary' : 'text-fg-secondary hover:bg-neutral-50')}>{label}</button></li>)}</ul>
        </nav>
        <fieldset disabled={saving} className="min-w-0 space-y-6 pb-28">
          {section('basics', <><BasicInfoFields {...fields} locked={locked} readOnlyLocked hideCover descriptionMax={5000} /><ScopeOutcomeFields {...fields} /><EditorMediaFields form={form} service={service} onChange={changeField} locked={locked} /></>)}
          {section('subject', <><dl className="grid gap-4 rounded-xl bg-neutral-50 p-4 text-body-reg sm:grid-cols-2"><div><dt className="text-fg-secondary">Môn học · Chỉ đọc</dt><dd className="mt-1 font-medium text-fg">{service.subjectName}</dd></div><div><dt className="text-fg-secondary">Danh mục</dt><dd className="mt-1 font-medium text-fg">{service.subjectCategoryName || 'Chưa có danh mục'}</dd></div></dl>{locked ? <div><p className="mb-3 text-body-reg font-medium text-fg">Thẻ liên quan · Chỉ đọc</p><div className="flex flex-wrap gap-2">{parseTags(form.tags).map(tag => <span key={tag} className="rounded-lg bg-brand-primary-50 px-3 py-2 text-caption text-primary">{tag}</span>)}{!parseTags(form.tags).length && <p className="text-body-reg text-fg-secondary">Chưa có thẻ liên quan.</p>}</div></div> : <ChipEditor id="service-tags" label="Thẻ liên quan" items={parseTags(form.tags)} max={10} maxLength={30} onChange={items => changeField('tags', items.join(', '))} />}</>)}
          {section('terms', locked ? <><p className="font-medium text-fg">Điều khoản gói học đang được bảo vệ</p><dl className="divide-y divide-border rounded-xl bg-neutral-50 px-4 text-body-reg">{[['Số buổi học', `${form.totalSessions} buổi`], ['Thời lượng mỗi buổi', `${form.sessionDurationMinutes} phút`], ['Học phí trọn gói', <Money key="price" value={form.price} />]].map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-2 py-4"><dt className="text-fg-secondary">{label}</dt><dd className="font-semibold text-fg">{value}</dd></div>)}</dl><details className="text-body-reg text-fg-secondary"><summary className="cursor-pointer font-medium text-primary">Tìm hiểu cách chỉnh sửa điều khoản</summary><p className="mt-3 leading-relaxed">Trong Gói học của tôi, chọn Thêm thao tác → Tạm dừng tuyển sinh hoặc Gỡ xuất bản, rồi mở lại trang chỉnh sửa. Các hợp đồng đã mua vẫn giữ điều khoản ban đầu.</p><Button variant="ghost" className="mt-2 px-0 text-primary" onClick={goBack}>Về quản lý gói học</Button></details></> : <div className="grid gap-4 sm:grid-cols-2"><Field label="Số buổi học" htmlFor="service-sessions" required><Input id="service-sessions" type="number" min={1} step={1} value={form.totalSessions} onChange={event => changeField('totalSessions', event.target.value)} /></Field><Field label="Phút mỗi buổi" htmlFor="service-duration" required><Input id="service-duration" type="number" min={1} step={1} value={form.sessionDurationMinutes} onChange={event => changeField('sessionDurationMinutes', event.target.value)} /></Field><Field label="Học phí trọn gói (₫)" htmlFor="service-price" required className="sm:col-span-2"><Input id="service-price" type="number" min={0.01} step={0.01} value={form.price} onChange={event => changeField('price', event.target.value)} /></Field></div>)}
          {section('curriculum', <CurriculumEditor form={form} onChange={changeField} errorField={validation?.fieldId} />)}
          {section('audience', <><ChipEditor id="service-audience" label="Đối tượng phù hợp" items={splitLines(form.targetAudienceText)} onChange={items => changeField('targetAudienceText', items.join('\n'))} /><ChipEditor id="service-prereq" label="Điều kiện tiên quyết" items={splitLines(form.prerequisitesText)} onChange={items => changeField('prerequisitesText', items.join('\n'))} /></>)}
          {section('faq', <FaqEditor items={form.faqs} onChange={items => changeField('faqs', items)} errorField={validation?.fieldId} />)}
        </fieldset>
      </div>
      <div data-testid="service-save-bar" className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-brand-md lg:bottom-4">
        {saveError && <p role="alert" className="text-body-reg text-danger-strong">{saveError}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" aria-live="polite" className="text-caption text-fg-secondary">{saving ? 'Đang lưu thay đổi…' : dirty ? 'Có thay đổi chưa lưu' : saved ? 'Đã lưu thay đổi' : 'Không có thay đổi cần lưu'}</p><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={goBack} disabled={saving}>Hủy</Button><Button type="submit" loading={saving} disabled={!dirty} icon={<Icon name="check" size="sm" />}>{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</Button></div></div>
      </div>
    </form>
    <ServiceEditorPreview open={preview} onClose={() => setPreview(false)} form={form} service={service} />
  </div>;
}
