import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import tutorService from '@/services/tutor.service';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
import { DetailSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/Dialog';
import { ServiceStatusBadge } from '@/components/tutor/services/ServiceRow';
import { BasicInfoFields, ScopeOutcomeFields, TrialFields, SubjectFields, PackageTermsFields, CurriculumFields, FaqFields } from '@/components/tutor/services/ServiceFormSections';
import { buildServicePayload, collectFaqs, validateServiceForm } from '@/components/tutor/services/serviceFormUtils';
import { serviceListingReturn, serviceToForm } from '@/utils/tutorServiceManagement';

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
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const requestVersion = useRef(0);
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true); setError(null);
    try {
      const result = await tutorService.getMyServiceById(id);
      if (version !== requestVersion.current) return;
      setService(result); setForm(serviceToForm(result)); setDirty(false); setSaveError('');
    } catch (err) { if (version === requestVersion.current) setError(err); }
    finally { if (version === requestVersion.current) setLoading(false); }
  }, [id]);
  useEffect(() => { load(); return () => { requestVersion.current += 1; }; }, [load]);

  const goBack = () => navigate(returnTo.path, { replace: true, state: returnTo.key ? { restoreScrollKey: returnTo.key } : undefined });
  const cancel = async () => {
    if (submitting.current) return;
    if (dirty && !await confirm({ title: 'Bỏ thay đổi chưa lưu?', content: 'Các thay đổi ở gói học này chưa được lưu.', confirmText: 'Bỏ thay đổi', cancelText: 'Tiếp tục chỉnh sửa' })) return;
    goBack();
  };
  const changeField = (field, value) => { setForm(previous => ({ ...previous, [field]: value })); setDirty(true); setSaveError(''); };
  const save = async event => {
    event.preventDefault();
    if (submitting.current) return;
    const validation = validateServiceForm(form, 'update') || collectFaqs(form).error;
    if (validation) { setSaveError(validation); return; }
    submitting.current = true; setSaving(true); setSaveError('');
    const version = requestVersion.current;
    try {
      await tutorService.updateService(id, buildServicePayload(form, { mode: 'update', lockCommercialTerms: service.status === 'Published' }));
      if (version !== requestVersion.current) return;
      toast.success('Đã lưu thay đổi gói học.');
      goBack();
    } catch (err) {
      if (version === requestVersion.current) setSaveError(err?.status === 409
        ? 'Trạng thái gói học đã thay đổi. Quay lại danh sách để kiểm tra trước khi sửa thông tin tuyển sinh.'
        : 'Chưa lưu được gói học. Nội dung bạn nhập vẫn được giữ lại. Vui lòng thử lại.');
    } finally { submitting.current = false; setSaving(false); }
  };

  if (loading) return <div role="status" aria-label="Đang tải gói học"><DetailSkeleton /></div>;
  if (error || !service || !form) return <ErrorState title="Chưa mở được gói học" error={error} onRetry={load} backPath={returnTo.path} backLabel="Về gói học của tôi" />;
  const locked = service.status === 'Published';
  const fields = { formData: form, onFieldChange: changeField };
  return <div className="mx-auto max-w-4xl space-y-6">
    <Button variant="ghost" onClick={cancel} disabled={saving} icon={<Icon name="arrow_back" size="sm" />}>Về gói học của tôi</Button>
    <WorkspacePageHeader title={service.status === 'Draft' ? 'Hoàn thiện gói học' : 'Chỉnh sửa gói học'} description={service.title} />
    <div className="flex flex-wrap items-center gap-3"><ServiceStatusBadge status={service.status} /><p className="text-caption text-fg-secondary">Các hợp đồng đã ký giữ nguyên học phí, số buổi và thời lượng.</p></div>
    {locked && <p className="rounded-xl bg-brand-primary-50 p-4 text-body-reg leading-relaxed text-fg-secondary">Bạn có thể cập nhật nội dung giảng dạy. Để đổi học phí, số buổi, thời lượng, ảnh bìa, mô tả ngắn hoặc thẻ, hãy tạm dừng tuyển sinh hoặc gỡ xuất bản gói học trước.</p>}
    <form onSubmit={save} className="space-y-6">
      <fieldset disabled={saving} className="min-w-0 space-y-6">
        <Card as="section" padding="lg" variant="outlined" className="space-y-4 rounded-2xl" aria-labelledby="edit-basics-title"><h2 id="edit-basics-title" className="text-headline-3 font-semibold text-fg">Thông tin gói học</h2><BasicInfoFields {...fields} locked={locked} /><ScopeOutcomeFields {...fields} /><TrialFields {...fields} /></Card>
        <Card as="section" padding="lg" variant="outlined" className="space-y-4 rounded-2xl" aria-labelledby="edit-subject-title"><h2 id="edit-subject-title" className="text-headline-3 font-semibold text-fg">Môn học và thẻ</h2><SubjectFields {...fields} subjects={[]} editingService={{ ...service, categoryName: service.subjectCategoryName }} locked={locked} /></Card>
        <Card as="section" padding="lg" variant="outlined" className="space-y-4 rounded-2xl" aria-labelledby="edit-terms-title"><h2 id="edit-terms-title" className="text-headline-3 font-semibold text-fg">Học phí và thời lượng</h2><PackageTermsFields {...fields} locked={locked} /></Card>
        <Card as="section" padding="lg" variant="outlined" className="space-y-4 rounded-2xl" aria-label="Lộ trình và câu hỏi thường gặp"><CurriculumFields {...fields} /><FaqFields {...fields} /></Card>
      </fieldset>
      {saveError && <p role="alert" className="rounded-xl bg-danger-subtle p-4 text-body-reg text-danger-strong">{saveError}</p>}
      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5"><Button variant="outline" onClick={cancel} disabled={saving}>Hủy</Button><Button type="submit" loading={saving} disabled={!dirty} icon={<Icon name="check" size="sm" />}>{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</Button></div>
    </form>
  </div>;
}
