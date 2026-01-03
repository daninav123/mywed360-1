import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Bell, User, Mail, Moon, LogOut } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth.jsx';
import DarkModeToggle from '../components/DarkModeToggle';
import LanguageSelector from '../components/ui/LanguageSelector';
import Nav from '../components/Nav';
import NotificationCenter from '../components/NotificationCenter';
import PageWrapper from '../components/PageWrapper';
import NotificationSettings from '../components/settings/NotificationSettings';
import Button from '../components/ui/Button';
import {
  getNotifications,
  markNotificationRead,
  deleteNotification,
} from '../services/notificationService';
import {
  isSupported as pushSupported,
  subscribe as pushSubscribe,
  unsubscribe as pushUnsubscribe,
  sendTest as pushTest,
} from '../services/PushService';

const typeColors = {
  success:
    'bg-[var(--color-success-10)] border-[color:var(--color-success-40)] text-[color:var(--color-success)]',
  error:
    'bg-[var(--color-danger-10)] border-[color:var(--color-danger-40)] text-[color:var(--color-danger)]',
  warning:
    'bg-[var(--color-warning-10)] border-[color:var(--color-warning-40)] text-[color:var(--color-warning)]',
  info: 'bg-[var(--color-primary-10)] border-[color:var(--color-primary-40)] text-[color:var(--color-primary)]',
};

export default function Notificaciones() {
  const { t } = useTranslations();
  const { logout: logoutUnified } = useAuth();
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState([]);
  const [pushEnabled, setPushEnabled] = useState(false);

  const refresh = async () => setItems(await getNotifications());

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('maloveapp-notif', handler);
    return () => window.removeEventListener('maloveapp-notif', handler);
  }, []);

  useEffect(() => {
    (async () => {
      if (!pushSupported()) return;
      try {
        setPushEnabled(!!(await navigator.serviceWorker.ready).pushManager);
      } catch {}
    })();
  }, []);

  // Preferencias antiguas removidas (se usan las nuevas en NotificationSettings)

  const filtered = items.filter((n) => (filter === 'unread' ? !n.read : true));

  return (
    <>
    <div className="absolute top-4 right-4 flex items-center space-x-3" style={{ zIndex: 100 }}>
      <LanguageSelector variant="minimal" />
      <div className="relative" data-user-menu>
        <button onClick={() => setOpenUserMenu(!openUserMenu)} className="w-11 h-11 rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center" title={t('navigation.userMenu', { defaultValue: 'Menú de usuario' })} style={{ backgroundColor: openUserMenu ? 'var(--color-lavender)' : 'rgba(255, 255, 255, 0.95)', border: `2px solid ${openUserMenu ? 'var(--color-primary)' : 'rgba(255,255,255,0.8)'}`, boxShadow: openUserMenu ? '0 4px 12px rgba(94, 187, 255, 0.3)' : '0 2px 8px rgba(0,0,0,0.15)' }}>
          <User className="w-5 h-5" style={{ color: openUserMenu ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />
        </button>
        {openUserMenu && (
          <div className="absolute right-0 mt-3 bg-[var(--color-surface)] p-2 space-y-1" style={{ minWidth: '220px', border: '1px solid var(--color-border-soft)', borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 9999 }}>
            <div className="px-2 py-1"><NotificationCenter /></div>
            <Link to="/perfil" onClick={() => setOpenUserMenu(false)} className="flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200" className="text-body" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <User className="w-4 h-4 mr-3" />{t('navigation.profile', { defaultValue: 'Perfil' })}
            </Link>
            <Link to="/email" onClick={() => setOpenUserMenu(false)} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'} className="flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200" className="text-body">
              <Mail className="w-4 h-4 mr-3" />{t('navigation.emailInbox', { defaultValue: 'Buzón de Emails' })}
            </Link>
            <div className="px-3 py-2.5 rounded-xl transition-all duration-200" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <div className="flex items-center justify-between"><span className="text-sm flex items-center" className="text-body"><Moon className="w-4 h-4 mr-3" />{t('navigation.darkMode', { defaultValue: 'Modo oscuro' })}</span><DarkModeToggle className="ml-2" /></div>
            </div>
            <div style={{ height: '1px', backgroundColor: 'var(--color-border-soft)', margin: '8px 0' }}></div>
            <button onClick={() => { logoutUnified(); setOpenUserMenu(false); }} className="w-full text-left px-3 py-2.5 text-sm rounded-xl transition-all duration-200 flex items-center" className="text-danger" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-danger-10)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <LogOut className="w-4 h-4 mr-3" />{t('navigation.logout', { defaultValue: 'Cerrar sesión' })}
            </button>
          </div>
        )}
      </div>
    </div>
    <div className="p-6">
      {/* Ajustes de notificaciones */}
      <NotificationSettings />

      <div className="flex space-x-2 mt-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-[var(--color-primary)] text-white' : 'bg-[color:var(--color-text-10)]'}`}
        >
          {t('notifications.filters.all')}
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1 rounded ${filter === 'unread' ? 'bg-[var(--color-primary)] text-white' : 'bg-[color:var(--color-text-10)]'}`}
        >
          {t('notifications.filters.unread')}
        </button>
      </div>

      {pushSupported() && (
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={async () => {
              try {
                await pushSubscribe();
                toast.success(t('notifications.push.enableSuccess'));
              } catch (e) {
                toast.error(t('notifications.push.enableError'));
              }
            }}
            className="px-3 py-1 rounded  text-white" style={{ backgroundColor: 'var(--color-success)' }}
          >
            {t('notifications.push.enable')}
          </button>
          <button
            onClick={async () => {
              try {
                await pushUnsubscribe();
                toast.success(t('notifications.push.disableSuccess'));
              } catch (e) {
                toast.error(t('notifications.push.disableError'));
              }
            }}
            className="px-3 py-1 rounded bg-gray-200"
          >
            {t('notifications.push.disable')}
          </button>
          <button
            onClick={async () => {
              const ok = await pushTest();
              ok ? toast.success(t('notifications.push.testSuccess')) : toast.error(t('notifications.push.testError'));
            }}
            className="px-3 py-1 rounded  text-white" style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {t('notifications.push.test')}
          </button>
        </div>
      )}

      {/* Preferencias granulares antiguas eliminadas a favor del nuevo panel */}

      <div className="bg-[var(--color-surface)] border border-soft rounded divide-y divide-[color:var(--color-text-10)]">
        {filtered.length === 0 && (
          <p className="p-4 text-[color:var(--color-text-60)]">{t('notifications.empty')}</p>
        )}
        {filtered.map((n) => (
          <div
            key={n.id}
            className={`flex justify-between p-4 text-sm ${typeColors[n.type] || typeColors.info}`}
          >
            <div>
              <p className="font-medium">{n.message}</p>
              <span className="text-xs text-[color:var(--color-text-60)]">
                {new Date(n.date).toLocaleString('es-ES')}
              </span>
            </div>
            <div className="flex gap-2 items-start ml-4">
              {!n.read && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    await markNotificationRead(n.id);
                    await refresh();
                  }}
                >
                  {t('notifications.markRead')}
                </Button>
              )}
              <Button
                variant="outline"
                className="text-[color:var(--color-danger)]"
                onClick={async () => {
                  await deleteNotification(n.id);
                  await refresh();
                }}
              >
                {t('notifications.delete')}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
    <Nav />
    </>
  );
}
