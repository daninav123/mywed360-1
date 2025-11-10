import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Users, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import { Card, Button, Input } from '../components/ui';
import LanguageSelector from '../components/ui/LanguageSelector';
import SubscriptionWidget from '../components/subscription/SubscriptionWidget';
import { useWedding } from '../context/WeddingContext';
import { auth, db } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import useRoles from '../hooks/useRoles';
import { changeLanguage, getCurrentLanguage } from '../i18n';
import { loadData } from '../services/SyncService';
import { invitePlanner, getWeddingIdForOwner } from '../services/WeddingService';

function Perfil() {
  const { t } = useTranslation();
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
  const [weddingInfo, setWeddingInfo] = useState({
    coupleName: '',
    celebrationPlace: '',
    celebrationAddress: '',
    banquetPlace: '',
    receptionAddress: '',
    schedule: '',
    weddingDate: '',
    rsvpDeadline: '',
    giftAccount: '',
    transportation: '',
    weddingStyle: '',
    colorScheme: '',
    numGuests: '',
  });
  const [importantInfo, setImportantInfo] = useState('');  const [plannerEmail, setPlannerEmail] = useState('');
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

  // Actualiza nmero de invitados (con muestra local si no hay datos)
  useEffect(() => {
    function updateGuestCount() {
      let guests = [];
      try {
        guests = JSON.parse(localStorage.getItem('mywed360Guests'));
        if (!Array.isArray(guests)) guests = null;
      } catch {
        guests = null;
      }
      if (!guests) {
        guests = [
          {
            id: 1,
            name: 'Ana Garc\u00EDa',
            phone: '123456789',
            address: 'Calle Sol 1',
            companion: 1,
            table: '5',
            response: 'S\u00ED',
          },
          {
            id: 2,
            name: 'Luis Mart\u00EDnez',
            phone: '987654321',
            address: 'Av. Luna 3',
            companion: 0,
            table: '',
            response: 'Pendiente',
          },
        ];
      }
      const total = guests.reduce((acc, g) => acc + 1 + (parseInt(g.companion) || 0), 0);
      setWeddingInfo((w) => ({ ...w, numGuests: total }));
    }
    updateGuestCount();
    window.addEventListener('maloveapp-guests', updateGuestCount);
    return () => window.removeEventListener('maloveapp-guests', updateGuestCount);
  }, []);

  // Notas importantes (desde eventos externos)
  useEffect(() => {
    function updateNotes() {
      const p = loadData('importantNotes');
      if (p && typeof p.then === 'function') p.then((val) => setImportantInfo(val ?? ''));
      else setImportantInfo(p ?? '');
    }
    window.addEventListener('maloveapp-important-note', updateNotes);
    return () => window.removeEventListener('maloveapp-important-note', updateNotes);
  }, []);

  const handleAccountChange = (e) =>
    setAccount((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleWeddingChange = (e) =>
    setWeddingInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleBillingChange = (e) =>
    setBilling((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const accountFields = [
    { name: 'name', labelKey: 'profile.account.name', defaultValue: 'Nombre' },
    { name: 'linkedAccount', labelKey: 'profile.account.linkedAccount', defaultValue: 'Cuenta vinculada' },
    { name: 'planner', labelKey: 'profile.account.planner', defaultValue: 'Wedding planner vinculada' },
    { name: 'helpers', labelKey: 'profile.account.helpers', defaultValue: 'Ayudantes vinculados' },
    { name: 'email', labelKey: 'profile.account.email', defaultValue: 'Correo electrónico', type: 'email' },
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

  const weddingFields = [
    { name: 'coupleName', labelKey: 'profile.wedding.coupleName', defaultValue: 'Nombre de la pareja' },
    { name: 'celebrationPlace', labelKey: 'profile.wedding.celebrationPlace', defaultValue: 'Lugar de la celebración' },
    { name: 'celebrationAddress', labelKey: 'profile.wedding.celebrationAddress', defaultValue: 'Dirección de la celebración' },
    { name: 'banquetPlace', labelKey: 'profile.wedding.banquetPlace', defaultValue: 'Lugar del banquete' },
    { name: 'receptionAddress', labelKey: 'profile.wedding.receptionAddress', defaultValue: 'Dirección del banquete' },
    { name: 'schedule', labelKey: 'profile.wedding.schedule', defaultValue: 'Horario (ceremonia/recepción)' },
    { name: 'weddingDate', labelKey: 'profile.wedding.date', defaultValue: 'Fecha de la boda', type: 'date' },
    { name: 'rsvpDeadline', labelKey: 'profile.wedding.rsvp', defaultValue: 'Fecha límite RSVP', type: 'date' },
    { name: 'giftAccount', labelKey: 'profile.wedding.giftAccount', defaultValue: 'Cuenta de regalos' },
    { name: 'transportation', labelKey: 'profile.wedding.transportation', defaultValue: 'Transporte / alojamiento' },
    { name: 'weddingStyle', labelKey: 'profile.wedding.style', defaultValue: 'Estilo de la boda' },
    {
      name: 'colorScheme',
      labelKey: 'profile.wedding.colorScheme',
      defaultValue: 'Paleta de colores (web)',
      placeholderKey: 'profile.wedding.colorSchemePlaceholder',
      placeholderDefault: 'Blanco y dorado',
    },
    {
      name: 'numGuests',
      labelKey: 'profile.wedding.numGuests',
      defaultValue: 'Número de invitados',
      type: 'number',
      readOnly: true,
    },
  ];

  const billingFields = [
    { name: 'fullName', labelKey: 'profile.billing.fullName', defaultValue: 'Nombre completo' },
    { name: 'address', labelKey: 'profile.billing.address', defaultValue: 'Dirección' },
    { name: 'zip', labelKey: 'profile.billing.zip', defaultValue: 'CP' },
    { name: 'city', labelKey: 'profile.billing.city', defaultValue: 'Localidad' },
    { name: 'state', labelKey: 'profile.billing.state', defaultValue: 'Provincia' },
    { name: 'country', labelKey: 'profile.billing.country', defaultValue: 'País' },
    { name: 'dni', labelKey: 'profile.billing.dni', defaultValue: 'DNI' },
  ];

  const handleCreateInvite = async () => {
    if (!plannerEmail) return;
    let wid = weddingId;
    const effectiveUid = fallbackUid;
    if (!wid && !effectiveUid) {
      toast.error(t('profile.errors.sessionNotReady', { defaultValue: 'Tu sesión aún no está lista. Inténtalo de nuevo.' }));
      return;
    }
    if (!wid) {
      wid = await getWeddingIdForOwner(effectiveUid);
      if (!wid) {
        toast.error(t('profile.errors.weddingNotFound', { defaultValue: 'No se encontró tu boda.' }));
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
      console.error(err);
      toast.error(t('profile.errors.creatingInvite', { defaultValue: 'Error creando invitación' }));
    } finally {
      setInviteLoading(false);
    }
  };

  const saveProfile = async () => {
    const uid = fallbackUid;
    if (!uid) {
      toast.error(t('profile.errors.userNotFound', { defaultValue: 'No se pudo determinar tu usuario' }));
      return;
    }
    // Validaciones rÍpidas
    try {
      if (account.email && !/^\S+@\S+\.\S+$/.test(account.email)) {
        toast.error(t('profile.errors.invalidEmail', { defaultValue: 'Correo electrónico inválido' }));
        return;
      }
      if (account.whatsNumber && !/^\+?[0-9]{8,15}$/.test(account.whatsNumber.trim())) {
        toast.error(t('profile.errors.invalidWhatsapp', { defaultValue: 'WhatsApp debe tener formato internacional, ej. +349XXXXXXXX' }));
        return;
      }
      if (weddingInfo.weddingDate) {
        const d = new Date(weddingInfo.weddingDate);
        if (isNaN(d.getTime())) {
          toast.error(t('profile.errors.invalidWeddingDate', { defaultValue: 'Fecha de boda inválida' }));
          return;
        }
      }
    } catch {}
    try {
      await setDoc(
        doc(db, 'users', uid),
        { account, subscription, billing, updatedAt: serverTimestamp() },
        { merge: true }
      );
      if (weddingId)
        await updateDoc(doc(db, 'weddings', weddingId), {
          weddingInfo: { ...weddingInfo, importantInfo },
        });
      toast.success(t('profile.success.saved', { defaultValue: 'Perfil guardado' }));
      try {
        setLastSavedAt(new Date());
      } catch {}
    } catch (e) {
      console.error(e);
      toast.error(t('profile.errors.savingProfile', { defaultValue: 'Error al guardar el perfil' }));
    }
  };

  useEffect(() => {    const loadProfileData = async () => {
      const uid = fallbackUid;
      if (!uid) return;
      try {
        const userSnap = await getDoc(doc(db, 'users', uid));
        if (userSnap.exists()) {
          const d = userSnap.data();
          if (d.account) setAccount((prev) => ({ ...prev, ...d.account }));
          if (d.subscription) setSubscription(d.subscription);
          if (d.billing) setBilling(d.billing);
          // Apply saved language preference if any
          try {
            const savedLang = d?.preferences?.language;
            if (savedLang && savedLang !== getCurrentLanguage()) {
              await changeLanguage(savedLang);
              try {
                localStorage.setItem('i18nextLng', savedLang);
              } catch {}
              try {
                if (auth) auth.languageCode = savedLang;
              } catch {}
            }
          } catch {}
          // Preferencias musicales ahora se gestionan desde Momentos Especiales
          try {
            if (d.updatedAt && typeof d.updatedAt.toDate === 'function') {
              setLastSavedAt(d.updatedAt.toDate());
            }
          } catch {}
        }
        if (weddingId) {
          const wedSnap = await getDoc(doc(db, 'weddings', weddingId));
          if (wedSnap.exists() && wedSnap.data().weddingInfo) {
            const wi = wedSnap.data().weddingInfo;
            setWeddingInfo({
              coupleName: wi.coupleName || '',
              celebrationPlace: wi.celebrationPlace || '',
              celebrationAddress: wi.celebrationAddress || '',
              banquetPlace: wi.banquetPlace || '',
              receptionAddress: wi.receptionAddress || '',
              schedule: wi.schedule || '',
              weddingDate: wi.weddingDate || '',
              rsvpDeadline: wi.rsvpDeadline || '',
              giftAccount: wi.giftAccount || '',
              transportation: wi.transportation || '',
              weddingStyle: wi.weddingStyle || '',
              colorScheme: wi.colorScheme || '',
              numGuests: wi.numGuests || '',
            });
            if (wi.importantInfo) setImportantInfo(wi.importantInfo);
          }
        }
      } catch (e) {
        console.error('Error cargando perfil', e);
        toast.error(t('profile.errors.loadingProfile', { defaultValue: 'Error al cargar el perfil' }));
      }
    };
    // Preferencias musicales ahora se gestionan desde Momentos Especiales
    loadProfileData();  }, [weddingId]);

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('navigation.profile', { defaultValue: 'Perfil' })}</h1>
        <div className="mt-2">
          <LanguageSelector />
        </div>
        {lastSavedAt && (
          <div className="text-sm text-muted">
            {t('profile.lastSaved', { defaultValue: 'Último guardado:' })}{' '}
            {new Date(lastSavedAt).toLocaleString()}
          </div>
        )}
      </div>
      {/* Suscripción Real con Stripe */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">
          {t('profile.subscription.type', { defaultValue: 'Tipo de suscripción' })}
        </h2>
        <SubscriptionWidget />
      </div>


      <Card className="space-y-4">
        <h2 className="text-lg font-medium">{t('profile.account.title', { defaultValue: 'Información de la cuenta' })}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {accountFields.map((field) => (
            <Input
              key={field.name}
              label={t(field.labelKey, { defaultValue: field.defaultValue })}
              name={field.name}
              type={field.type}
              placeholder={
                field.placeholderKey
                  ? t(field.placeholderKey, { defaultValue: field.placeholderDefault })
                  : field.placeholder
              }
              value={account[field.name] ?? ''}
              onChange={handleAccountChange}
            />
          ))}
        </div>
        <div className="text-right">
          <Button onClick={saveProfile}>{t('app.save', { defaultValue: 'Guardar' })}</Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-medium">{t('profile.wedding.title', { defaultValue: 'Información de la boda' })}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {weddingFields.map((field) => (
            <Input
              key={field.name}
              label={t(field.labelKey, { defaultValue: field.defaultValue })}
              name={field.name}
              type={field.type}
              placeholder={
                field.placeholderKey
                  ? t(field.placeholderKey, { defaultValue: field.placeholderDefault })
                  : field.placeholder
              }
              value={weddingInfo[field.name] ?? ''}
              readOnly={field.readOnly}
              onChange={field.readOnly ? undefined : handleWeddingChange}
            />
          ))}
        </div>
        <div className="text-right">
          <Button onClick={saveProfile}>{t('app.save', { defaultValue: 'Guardar' })}</Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-medium">{t('profile.wedding.important', { defaultValue: 'Información importante de la boda' })}</h2>
        <textarea
          className="w-full min-h-[150px] border rounded-md p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={t('profile.wedding.notesPlaceholder', {
            defaultValue: 'Datos o detalles clave (alergias, proveedores críticos, horarios especiales, etc.)',
          })}
          value={importantInfo}
          onChange={(e) => setImportantInfo(e.target.value)}
        />
        <div className="text-right">
          <Button onClick={saveProfile}>{t('app.save', { defaultValue: 'Guardar' })}</Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-medium flex items-center">
          <Users className="w-5 h-5 mr-2" />
          {t('profile.collaborators.title', { defaultValue: 'Colaboradores' })}
        </h2>
        <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
          <Input
            placeholder={t('profile.collaborators.plannerEmail', { defaultValue: 'Email del planner' })}
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
                <th className="text-left p-2">{t('profile.collaborators.user', { defaultValue: 'Usuario' })}</th>
                <th className="text-left p-2">{t('profile.collaborators.role', { defaultValue: 'Rol' })}</th>
                <th className="p-2 text-center">{t('profile.collaborators.actions', { defaultValue: 'Acciones' })}</th>
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
                        {t('profile.collaborators.rolePlanner', { defaultValue: 'Wedding Planner' })}
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
                        className="text-red-500 hover:text-red-700"
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
        <h2 className="text-lg font-medium">{t('profile.billing.title', { defaultValue: 'Datos de facturación' })}</h2>
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
        <div className="text-right">
          <Button onClick={saveProfile}>{t('app.save', { defaultValue: 'Guardar' })}</Button>
        </div>
      </Card>
    </div>
  );
}

export default Perfil;
