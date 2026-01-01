import axios from 'axios';
import { Users, X, User, Mail, Phone, Calendar, MapPin, Save, Loader, Moon, LogOut, Check } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import useDebounce from '../hooks/useDebounce';

import { Card, Button, Input } from '../components/ui';
import LanguageSelector from '../components/ui/LanguageSelector';
import NotificationCenter from '../components/NotificationCenter';
import DarkModeToggle from '../components/DarkModeToggle';
import Nav from '../components/Nav';
import SubscriptionWidget from '../components/subscription/SubscriptionWidget';
import { useWedding } from '../context/WeddingContext';
import { auth } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import useRoles from '../hooks/useRoles';
import { changeLanguage, getCurrentLanguage } from '../i18n';
import { loadData } from '../services/SyncService';
import { invitePlanner, getWeddingIdForOwner } from '../services/WeddingService';

function Perfil() {
  const { t } = useTranslation();
  const [openMenu, setOpenMenu] = useState(false);
  const [subscription, setSubscription] = useState('free');
  const [account, setAccount] = useState({
    name: '',
    linkedAccount: '',
    planner: '',
    helpers: '',
    email: '',
    whatsNumber: '',
    password: '',
  });
  const [plannerEmail, setPlannerEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  const [billing, setBilling] = useState({
    fullName: '',
    address: '',
    zip: '',
    city: '',
    state: '',
    country: '',
    dni: '',
  });
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { userProfile, user: authUser } = useAuth();
  const fallbackUid = authUser?.uid || auth.currentUser?.uid || null;
  const { activeWedding } = useWedding();
  const weddingId = activeWedding || userProfile?.weddingId || '';
  const {
    roles: collaborators,
    loading: rolesLoading,
    assignRole,
    removeRole,
  } = useRoles(weddingId);

  const handleAccountChange = (e) => {
    setAccount((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setHasUnsavedChanges(true);
  };
  const handleBillingChange = (e) => {
    setBilling((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setHasUnsavedChanges(true);
  };

  const debouncedAccount = useDebounce(account, 2000);
  const debouncedBilling = useDebounce(billing, 2000);

  const accountFields = [
    { name: 'name', labelKey: 'profile.account.name', defaultValue: 'Nombre' },
    {
      name: 'linkedAccount',
      labelKey: 'profile.account.linkedAccount',
      defaultValue: 'Cuenta vinculada',
    },
    {
      name: 'planner',
      labelKey: 'profile.account.planner',
      defaultValue: 'Wedding planner vinculada',
    },
    { name: 'helpers', labelKey: 'profile.account.helpers', defaultValue: 'Ayudantes vinculados' },
    {
      name: 'email',
      labelKey: 'profile.account.email',
      defaultValue: 'Correo electrónico',
      type: 'email',
    },
    {
      name: 'whatsNumber',
      labelKey: 'profile.account.whatsapp',
      defaultValue: 'Número WhatsApp personal',
      placeholderKey: 'profile.account.whatsappPlaceholder',
      placeholderDefault: '+34xxxxxxxxx',
    },
    {
      name: 'password',
      labelKey: 'profile.account.password',
      defaultValue: 'Reestablecer contraseña',
      type: 'password',
    },
  ];

  const billingFields = [
    { name: 'fullName', labelKey: 'profile.billing.fullName' },
    { name: 'address', labelKey: 'profile.billing.address' },
    { name: 'zip', labelKey: 'profile.billing.zip' },
    { name: 'city', labelKey: 'profile.billing.city' },
    { name: 'state', labelKey: 'profile.billing.state' },
    { name: 'country', labelKey: 'profile.billing.country' },
    { name: 'dni', labelKey: 'profile.billing.dni' },
  ];

  const handleCreateInvite = async () => {
    if (!plannerEmail) return;
    let wid = weddingId;
    const effectiveUid = fallbackUid;
    if (!wid && !effectiveUid) {
      toast.error(
        t('profile.errors.sessionNotReady', {
          defaultValue: 'Tu sesión aún no está lista. Inténtalo de nuevo.',
        })
      );
      return;
    }
    if (!wid) {
      wid = await getWeddingIdForOwner(effectiveUid);
      if (!wid) {
        toast.error(
          t('profile.errors.weddingNotFound', { defaultValue: 'No se encontró tu boda.' })
        );
        return;
      }
    }
    try {
      setInviteLoading(true);
      const code = await invitePlanner(wid, plannerEmail.trim().toLowerCase());
      const link = `${window.location.origin}/invitation/${code}`;
      setInviteLink(link);
      try {
        await navigator.clipboard.writeText(link);
        toast.success(t('profile.collaborators.linkCopied', { defaultValue: 'Enlace copiado' }));
      } catch {
        toast.success(t('profile.collaborators.linkCreated', { defaultValue: 'Enlace generado' }));
      }
      setPlannerEmail('');
    } catch (err) {
      // console.error(err);
      toast.error(t('profile.errors.creatingInvite', { defaultValue: 'Error creando invitación' }));
    } finally {
      setInviteLoading(false);
    }
  };

  const saveProfile = async () => {
    const uid = fallbackUid;
    if (!uid) {
      toast.error(
        t('profile.errors.userNotFound', { defaultValue: 'No se pudo determinar tu usuario' })
      );
      return;
    }
    // Validaciones rÍpidas
    try {
      if (account.email && !/^\S+@\S+\.\S+$/.test(account.email)) {
        toast.error(
          t('profile.errors.invalidEmail', { defaultValue: 'Correo electrónico inválido' })
        );
        return;
      }
      if (account.whatsNumber && !/^\+?[0-9]{8,15}$/.test(account.whatsNumber.trim())) {
        toast.error(
          t('profile.errors.invalidWhatsapp', {
            defaultValue: 'WhatsApp debe tener formato internacional, ej. +349XXXXXXXX',
          })
        );
        return;
      }
    } catch {}
    try {
      await setDoc(
        doc(db, 'users', uid),
        { account, subscription, billing, updatedAt: serverTimestamp() },
        { merge: true }
      );
      toast.success(t('profile.success.saved'));
      try {
        setLastSavedAt(new Date());
      } catch {}
    } catch (e) {
      // console.error(e);
      toast.error(
        t('profile.errors.savingProfile')
      );
    }
  };

  useEffect(() => {
    const loadProfileData = async () => {
      if (!authUser) return;
      try {
        const token = await authUser.getIdToken();
        const response = await axios.get('http://localhost:4004/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          const { account, billing, subscription, updatedAt } = response.data.profile;
          if (account) setAccount((prev) => ({ ...prev, ...account }));
          if (subscription) setSubscription(subscription);
          if (billing) setBilling(billing);
          if (updatedAt) setLastSavedAt(new Date(updatedAt));
        }
      } catch (e) {
        if (e.response?.status !== 404) {
          console.error('Error cargando perfil:', e);
          toast.error(t('profile.errors.loadingProfile', { defaultValue: 'Error cargando perfil' }));
        }
      }
    };
    loadProfileData();
  }, [authUser]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const autoSave = async () => {
      const uid = fallbackUid;
      if (!uid) return;

      try {
        if (debouncedAccount.email && !/^\S+@\S+\.\S+$/.test(debouncedAccount.email)) {
          return;
        }
        if (debouncedAccount.whatsNumber && !/^\+?[0-9]{8,15}$/.test(debouncedAccount.whatsNumber.trim())) {
          return;
        }
      } catch {}

      try {
        setIsSaving(true);
        await setDoc(
          doc(db, 'users', uid),
          { 
            account: debouncedAccount, 
            subscription, 
            billing: debouncedBilling, 
            updatedAt: serverTimestamp() 
          },
          { merge: true }
        );
        setLastSavedAt(new Date());
        setHasUnsavedChanges(false);
      } catch (e) {
        console.error('Error auto-guardando perfil:', e);
      } finally {
        setIsSaving(false);
      }
    };

    autoSave();
  }, [debouncedAccount, debouncedBilling, subscription, hasUnsavedChanges, fallbackUid]);

   return (<div className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" style={{ backgroundColor: '#EDE8E0' }}>
        {/* Botones superiores derechos */}
        <div className="absolute top-4 right-4 flex items-center space-x-3" style={{ zIndex: 100 }}>
          <LanguageSelector variant="minimal" />
          
          <div className="relative" data-user-menu>
            <button
              onClick={() => setOpenMenu(!openMenu)}
              className="w-11 h-11 rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center"
              title={t('navigation.userMenu', { defaultValue: 'Menú de usuario' })}
              style={{
                backgroundColor: openMenu ? 'var(--color-lavender)' : 'rgba(255, 255, 255, 0.95)',
                border: `2px solid ${openMenu ? 'var(--color-primary)' : 'rgba(255,255,255,0.8)'}`,
                boxShadow: openMenu ? '0 4px 12px rgba(94, 187, 255, 0.3)' : '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              <User className="w-5 h-5" style={{ color: openMenu ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />
            </button>
            
            {openMenu && (
              <div 
                className="absolute right-0 mt-3 bg-[var(--color-surface)] p-2 space-y-1"
                style={{
                  minWidth: '220px',
                  border: '1px solid var(--color-border-soft)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  zIndex: 9999,
                }}
              >
                <div className="px-2 py-1">
                  <NotificationCenter />
                </div>

                <Link
                  to="/perfil"
                  onClick={() => setOpenMenu(false)}
                  className="flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200"
                  style={{ color: 'var(--color-text)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <User className="w-4 h-4 mr-3" />
                  {t('navigation.profile', { defaultValue: 'Perfil' })}
                </Link>

                <Link
                  to="/email"
                  onClick={() => setOpenMenu(false)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  className="flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200"
                  style={{ color: 'var(--color-text)' }}
                >
                  <Mail className="w-4 h-4 mr-3" />
                  {t('navigation.emailInbox', { defaultValue: 'Buzón de Emails' })}
                </Link>

                <div 
                  className="px-3 py-2.5 rounded-xl transition-all duration-200"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center" style={{ color: 'var(--color-text)' }}>
                      <Moon className="w-4 h-4 mr-3" />
                      {t('navigation.darkMode', { defaultValue: 'Modo oscuro' })}
                    </span>
                    <DarkModeToggle className="ml-2" />
                  </div>
                </div>

                <div style={{ height: '1px', backgroundColor: 'var(--color-border-soft)', margin: '8px 0' }}></div>
                
                <button
                  onClick={() => {
                    auth.signOut();
                    setOpenMenu(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm rounded-xl transition-all duration-200 flex items-center"
                  style={{ color: 'var(--color-danger)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-danger-10)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  {t('navigation.logout', { defaultValue: 'Cerrar sesión' })}
                </button>
              </div>
            )}
          </div>
        </div>
      <div className="mx-auto my-8" style={{
        maxWidth: '1024px',
        width: '100%',
        backgroundColor: '#FFFBF7',
        borderRadius: '32px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        overflow: 'hidden'
      }}>
        
        {/* Hero con degradado beige-dorado */}
        <header className="relative overflow-hidden" style={{
          background: 'linear-gradient(135deg, #FFF4E6 0%, #F8EFE3 50%, #E8D5C4 100%)',
          padding: '48px 32px 32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div className="max-w-4xl mx-auto" style={{ textAlign: 'center' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '16px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '60px',
                height: '1px',
                background: 'linear-gradient(to right, transparent, #D4A574)',
              }} />
              <h1 style={{
                fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
                fontSize: '40px',
                fontWeight: 400,
                color: '#1F2937',
                letterSpacing: '-0.01em',
                margin: 0,
              }}>{t('navigation.profile')}</h1>
              <div style={{
                width: '60px',
                height: '1px',
                background: 'linear-gradient(to left, transparent, #D4A574)',
              }} />
            </div>
            <p style={{
              fontFamily: "'DM Sans', 'Inter', sans-serif",
              fontSize: '11px',
              fontWeight: 600,
              color: '#9CA3AF',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 0,
            }}>Perfil de Usuario</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {isSaving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" style={{ color: 'var(--color-primary)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>Guardando...</span>
              </>
            ) : lastSavedAt ? (
              <>
                <Check className="w-4 h-4" style={{ color: '#10B981' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  {t('profile.synced', { defaultValue: 'Sincronizado' })}
                </span>
              </>
            ) : null}
          </div>
        </header>

        {/* Contenido */}
        <div className="px-6 py-6 space-y-6">
          
          {/* Suscripción Real con Stripe */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">
              {t('profile.subscription.type')}
            </h2>
            <SubscriptionWidget />
          </div>

          <Card className="space-y-4">
            <h2 className="text-lg font-medium">
              {t('profile.account.title')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {accountFields.map((field) => (
            <Input
              key={field.name}
              label={t(field.labelKey, { defaultValue: field.defaultValue })}
              name={field.name}
              type={field.type}
              placeholder={
                field.placeholderKey
                  ? t(field.placeholderKey)
                  : field.placeholder
              }
              value={account[field.name] ?? ''}
              onChange={handleAccountChange}
            />
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
        <h2 className="text-lg font-medium flex items-center">
          <Users className="w-5 h-5 mr-2" />
          {t('profile.collaborators.title', { defaultValue: 'Colaboradores' })}
        </h2>
        <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
          <Input
            placeholder={t('profile.collaborators.plannerEmail', {
              defaultValue: 'Email del planner',
            })}
            value={plannerEmail}
            onChange={(e) => setPlannerEmail(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleCreateInvite} disabled={inviteLoading || !plannerEmail}>
            {inviteLoading
              ? t('profile.collaborators.creating', { defaultValue: 'Creando...' })
              : t('profile.collaborators.createLink', { defaultValue: 'Crear enlace' })}
          </Button>
        </div>
        {inviteLink && (
          <p className="text-sm text-green-700 break-all mb-4 select-all">
            {t('profile.collaborators.linkGenerated', { defaultValue: 'Enlace generado:' })}{' '}
            <span className="underline">{inviteLink}</span>
          </p>
        )}
        {rolesLoading ? (
          <p>{t('app.loading', { defaultValue: 'Cargando...' })}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">
                  {t('profile.collaborators.user', { defaultValue: 'Usuario' })}
                </th>
                <th className="text-left p-2">
                  {t('profile.collaborators.role', { defaultValue: 'Rol' })}
                </th>
                <th className="p-2 text-center">
                  {t('profile.collaborators.actions', { defaultValue: 'Acciones' })}
                </th>
              </tr>
            </thead>
            <tbody>
              {collaborators.map((c) => (
                <tr key={c.userId || c.uid} className="border-b">
                  <td className="p-2">{c.email || c.userId || c.uid}</td>
                  <td className="p-2">
                    <select
                      value={c.role}
                      onChange={(e) => assignRole(c.userId || c.uid, e.target.value)}
                      disabled={c.role === 'owner'}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="owner">
                        {t('profile.collaborators.roleOwner', { defaultValue: 'Pareja' })}
                      </option>
                      <option value="planner">
                        {t('profile.collaborators.rolePlanner', {
                          defaultValue: 'Wedding Planner',
                        })}
                      </option>
                      <option value="helper">
                        {t('profile.collaborators.roleHelper', { defaultValue: 'Ayudante' })}
                      </option>
                    </select>
                  </td>
                  <td className="p-2 text-center">
                    {c.role !== 'owner' && (
                      <button
                        onClick={() => removeRole(c.userId || c.uid)}
                        className=" hover:text-red-700" style={{ color: 'var(--color-danger)' }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-medium">
          {t('profile.billing.title', { defaultValue: 'Datos de facturación' })}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {billingFields.map((field) => (
            <Input
              key={field.name}
              label={t(field.labelKey, { defaultValue: field.defaultValue })}
              name={field.name}
              value={billing[field.name] ?? ''}
              onChange={handleBillingChange}
            />
          ))}
        </div>
      </Card>
        </div>
      </div>
      <Nav />
    </div>
  );
}

export default Perfil;

