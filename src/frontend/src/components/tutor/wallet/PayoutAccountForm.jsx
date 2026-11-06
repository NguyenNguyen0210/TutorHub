import React, { useEffect, useState } from 'react';
import walletService from '@/services/wallet.service';
import { DEFAULT_BANK_CODE, findBank, VIETNAM_BANKS } from '@/config/vietnamBanks';
import {
  isPayoutAccountComplete,
  normalizeAccountHolder,
  payoutAccountPayload,
  validatePayoutAccount,
} from '@/utils/payoutAccount';
import { maskBankAccount } from '@/utils/tutorWallet';
import Input, { Field, Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Callout from '@/components/ui/Callout';
import { useToast } from '@/components/ui/Toast';

function draftFromAccount(account) {
  return {
    bankCode: findBank(account?.bankCode)?.code
      ?? findBank(account?.bankName)?.code
      ?? DEFAULT_BANK_CODE,
    accountNumber: account?.accountNumber ?? '',
    accountHolderName: account?.accountHolderName ?? '',
  };
}

/**
 * Tài khoản nhận tiền của gia sư — `GET/PUT /tutors/me/wallet/payout-account`.
 *
 * Trước đây backend đã có endpoint này nhưng không màn hình nào gọi, nên
 * `TutorProfiles.Bank*` luôn NULL và luồng rút tiền bị chặn vĩnh viễn
 * (`withdrawalBlocker` trong utils/tutorWallet). Component này là nơi ghi duy nhất.
 *
 * - Truyền `account` (object hoặc null) khi trang cha đã tải sẵn.
 * - Bỏ trống prop `account` để component tự gọi GET khi mount.
 */
export default function PayoutAccountForm({
  account: initialAccount,
  onSaved,
  disabled = false,
  description = 'TutorHub chuyển thu nhập về tài khoản này khi bạn yêu cầu rút tiền.',
}) {
  const toast = useToast();
  const [account, setAccount] = useState(initialAccount ?? null);
  const [loading, setLoading] = useState(initialAccount === undefined);
  const [loadError, setLoadError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => draftFromAccount(initialAccount));
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (initialAccount !== undefined) {
      setAccount(initialAccount);
      setEditing(!isPayoutAccountComplete(initialAccount));
      setDraft(draftFromAccount(initialAccount));
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    walletService.getPayoutAccount()
      .then(data => {
        if (cancelled) return;
        setAccount(data);
        setDraft(draftFromAccount(data));
        setEditing(!isPayoutAccountComplete(data));
        setLoadError(null);
      })
      .catch(err => { if (!cancelled) setLoadError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [initialAccount]);

  const complete = isPayoutAccountComplete(account);
  const payload = payoutAccountPayload(draft);
  const errors = validatePayoutAccount(payload);
  const fieldError = key => (touched[key] ? errors[key] : undefined);
  const change = (key, value) => {
    setDraft(previous => ({ ...previous, [key]: value }));
    setSaveError('');
  };
  const blur = key => setTouched(previous => ({ ...previous, [key]: true }));

  const startEditing = () => {
    setDraft(draftFromAccount(account));
    setTouched({});
    setSaveError('');
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraft(draftFromAccount(account));
    setTouched({});
    setSaveError('');
    setEditing(!complete);
  };

  const save = async event => {
    event.preventDefault();
    if (saving || disabled) return;
    setTouched({ bankName: true, accountNumber: true, accountHolderName: true });
    if (Object.keys(errors).length) return;

    setSaving(true);
    setSaveError('');
    try {
      const updated = await walletService.updatePayoutAccount(payload);
      const next = updated ?? payload;
      setAccount(next);
      setEditing(false);
      setTouched({});
      onSaved?.(next);
      toast.success('Đã lưu tài khoản nhận tiền.');
    } catch (err) {
      setSaveError(err?.message || 'Chưa lưu được tài khoản nhận tiền. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div role="status" aria-label="Đang tải tài khoản nhận tiền" className="h-[74px] rounded-xl bg-neutral-100 motion-safe:animate-pulse" />;
  }

  if (loadError) {
    return <Callout variant="danger" icon={<Icon name="report_problem" size="sm" />}>
      Chưa tải được tài khoản nhận tiền. Vui lòng tải lại trang hoặc thử lại sau.
    </Callout>;
  }

  if (complete && !editing) {
    return <div className="space-y-3 rounded-xl border border-border bg-neutral-50 p-4 text-body-reg">
      <dl className="space-y-1">
        <div><dt className="text-caption text-fg-secondary">Ngân hàng</dt><dd className="font-semibold text-fg">{account.bankName}</dd></div>
        <div><dt className="text-caption text-fg-secondary">Số tài khoản</dt><dd className="text-fg-secondary">{maskBankAccount(account.accountNumber)}</dd></div>
        <div><dt className="text-caption text-fg-secondary">Chủ tài khoản</dt><dd className="break-words text-fg-secondary">{account.accountHolderName}</dd></div>
      </dl>
      <Button type="button" variant="ghost" size="sm" className="px-0 text-primary" disabled={disabled} onClick={startEditing} icon={<Icon name="edit" size="sm" />}>
        Đổi tài khoản nhận tiền
      </Button>
    </div>;
  }

  const bankOptions = VIETNAM_BANKS.some(bank => bank.code === draft.bankCode)
    ? VIETNAM_BANKS
    : [...VIETNAM_BANKS, { code: draft.bankCode, name: draft.bankCode }];

  return <form onSubmit={save} noValidate className="space-y-4 rounded-xl border border-border bg-neutral-50 p-4">
    {!complete && <p className="text-body-reg leading-relaxed text-fg-secondary">
      Bạn cần khai báo tài khoản nhận tiền trước khi gửi yêu cầu rút thu nhập.
    </p>}
    <Field label="Ngân hàng nhận tiền" htmlFor="payout-bank" required error={fieldError('bankName')}>
      <Select
        id="payout-bank"
        value={draft.bankCode}
        disabled={disabled || saving}
        state={fieldError('bankName') ? 'error' : 'default'}
        aria-invalid={Boolean(fieldError('bankName'))}
        onChange={event => change('bankCode', event.target.value)}
      >
        {bankOptions.map(bank => <option key={bank.code} value={bank.code}>{bank.name} ({bank.code})</option>)}
      </Select>
    </Field>
    <Field
      label="Số tài khoản"
      htmlFor="payout-account-number"
      required
      hint="Chỉ gồm chữ số, 6–50 ký tự."
      error={fieldError('accountNumber')}
    >
      <Input
        id="payout-account-number"
        inputMode="numeric"
        autoComplete="off"
        maxLength={50}
        placeholder="Ví dụ: 0123456789"
        value={draft.accountNumber}
        disabled={disabled || saving}
        state={fieldError('accountNumber') ? 'error' : 'default'}
        aria-invalid={Boolean(fieldError('accountNumber'))}
        onChange={event => change('accountNumber', event.target.value.replace(/[^\d]/g, ''))}
        onBlur={() => blur('accountNumber')}
      />
    </Field>
    <Field
      label="Tên chủ tài khoản (in hoa, không dấu)"
      htmlFor="payout-account-holder"
      required
      error={fieldError('accountHolderName')}
    >
      <Input
        id="payout-account-holder"
        autoComplete="off"
        maxLength={150}
        placeholder="Ví dụ: NGUYEN VAN A"
        value={draft.accountHolderName}
        disabled={disabled || saving}
        state={fieldError('accountHolderName') ? 'error' : 'default'}
        aria-invalid={Boolean(fieldError('accountHolderName'))}
        onChange={event => change('accountHolderName', normalizeAccountHolder(event.target.value))}
        onBlur={() => blur('accountHolderName')}
      />
    </Field>
    <p className="text-caption leading-relaxed text-fg-secondary">{description}</p>
    {saveError && <p role="alert" className="rounded-lg bg-danger-subtle p-3 text-caption text-danger-strong">{saveError}</p>}
    <div className="flex flex-wrap justify-end gap-2">
      {complete && <Button type="button" variant="outline" size="sm" disabled={saving} onClick={cancelEditing}>Hủy</Button>}
      <Button type="submit" size="sm" loading={saving} disabled={disabled || saving} icon={!saving && <Icon name="check" size="sm" />}>
        {saving ? 'Đang lưu…' : 'Lưu tài khoản'}
      </Button>
    </div>
  </form>;
}
