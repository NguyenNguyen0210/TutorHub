import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Menu } from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import { accountMenuItems } from '@/utils/accountMenu';

/** The same account actions serve discovery, the workspace sidebar and mobile header. */
export default function AccountDropdown({ trigger, align = 'right', label = 'Mở menu tài khoản', className, triggerClassName }) {
  const { user, role, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const items = accountMenuItems(role, user?.idProfile || user?.tutorProfileId).map(item => item.type === 'divider' ? item : {
    ...item,
    icon: <Icon name={item.icon} size="sm" />,
    ...(item.external ? { target: '_blank', trailing: <Icon name="open_in_new" size="xs" />, ariaLabel: `${item.label} (mở trong tab mới)` } : {}),
    ...(item.key === 'logout' ? { onClick: async () => { await logout(); navigate('/auth/login'); } } : {}),
  });
  const current = items.some(item => !item.external && item.to && location.pathname === item.to);
  return <Menu trigger={trigger} label={label} items={items} align={align} className={className} triggerClassName={triggerClassName} current={current} appearance="account" />;
}
