import React, { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import userService from '@/services/user.service';
import tutorService from '@/services/tutor.service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function TeachingSubjects() {
  const { user } = useAuthStore();
  const client = useQueryClient();
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const busy = useRef(false);
  const key = ['teaching-subjects', user?.id];
  const query = useQuery({ queryKey: key, queryFn: async () => {
    const [profile, subjects] = await Promise.all([userService.getMyTutorProfile(), tutorService.getSubjects()]);
    return { subjects, selected: profile.subjects.filter(item => item.isActive).map(item => item.subjectId) };
  }, retry: false });
  const selected = draft ?? query.data?.selected ?? [];
  const dirty = draft !== null && [...selected].sort().join() !== [...(query.data?.selected || [])].sort().join();
  const save = async event => {
    event.preventDefault();
    if (busy.current || !dirty) return;
    busy.current = true; setSaving(true); setError(''); setSaved(false);
    try {
      const subjects = await tutorService.updateMySubjects(selected.map(subjectId => ({ subjectId, isActive: true })));
      client.setQueryData(key, previous => ({ ...previous, selected: subjects.filter(item => item.isActive).map(item => item.subjectId) }));
      setDraft(null); setSaved(true);
    } catch { setError('Chưa lưu được môn giảng dạy. Vui lòng kiểm tra môn học còn hoạt động và thử lại.'); }
    finally { busy.current = false; setSaving(false); }
  };
  return <Card as="section" padding="lg" variant="outlined" className="rounded-2xl space-y-4"><div><h2 className="text-lg font-semibold">Môn giảng dạy</h2><p className="mt-2 text-sm text-fg-secondary">Cập nhật môn học trên hồ sơ công khai. Thay đổi này không sửa môn học của hợp đồng đã mua.</p></div>
    {query.isPending ? <p role="status">Đang tải môn học…</p> : query.isError ? <><p role="alert">Chưa tải được môn giảng dạy.</p><Button variant="outline" onClick={() => query.refetch()}>Thử lại</Button></> : <form onSubmit={save} className="space-y-4"><fieldset disabled={saving} className="grid gap-2 sm:grid-cols-2"><legend className="sr-only">Chọn môn giảng dạy</legend>{query.data.subjects.map(subject => <label key={subject.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"><input type="checkbox" checked={selected.includes(subject.id)} onChange={e => { setDraft(e.target.checked ? [...selected, subject.id] : selected.filter(id => id !== subject.id)); setSaved(false); }} className="h-4 w-4 accent-blue-600" /><span>{subject.name}</span></label>)}</fieldset>{!query.data.subjects.length && <p className="text-sm text-fg-secondary">Chưa có môn học để lựa chọn.</p>}{selected.some(id => !query.data.subjects.some(subject => subject.id === id)) && <p className="text-sm text-holding-strong">Một số môn đã ngừng hoạt động. <button type="button" className="underline" onClick={() => setDraft(selected.filter(id => query.data.subjects.some(subject => subject.id === id)))}>Bỏ các môn không còn hoạt động</button></p>}{error && <p role="alert" className="text-sm text-danger-strong">{error}</p>}{saved && <p role="status" className="text-sm text-success-strong">Đã cập nhật môn giảng dạy.</p>}<div className="flex gap-3"><Button type="submit" loading={saving} disabled={saving || !dirty}>Lưu môn giảng dạy</Button>{dirty && <Button type="button" variant="ghost" disabled={saving} onClick={() => { setDraft(null); setError(''); }}>Hủy thay đổi</Button>}</div></form>}
  </Card>;
}
