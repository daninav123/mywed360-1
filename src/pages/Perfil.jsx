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
    window.addEventListener('mywed360-guests', updateGuestCount);
    return () => window.removeEventListener('mywed360-guests', updateGuestCount);
  }, []);

  // Notas importantes (desde eventos externos)
  useEffect(() => {
    function updateNotes() {
      const p = loadData('importantNotes');
      if (p && typeof p.then === 'function') p.then((val) => setImportantInfo(val ?? ''));
      else setImportantInfo(p ?? '');
    }
    window.addEventListener('mywed360-important-note', updateNotes);
    return () => window.removeEventListener('mywed360-important-note', updateNotes);
  }, []);

  const handleAccountChange = (e) =>
    setAccount((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleWeddingChange = (e) =>
    setWeddingInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleBillingChange = (e) =>
    setBilling((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCreateInvite = async () => {
    if (!plannerEmail) return;
    let wid = weddingId;
    const effectiveUid = fallbackUid;
    if (!wid && !effectiveUid) {
      toast.error('Tu sesi\u00F3n a\u00FAn no est\u00E1 lista. Int\u00E9ntalo de nuevo.');
      return;
    }
    if (!wid) {
      wid = await getWeddingIdForOwner(effectiveUid);
      if (!wid) {
        toast.error('No se encontr\u00F3 tu boda.');
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
        toast.success('Enlace copiado');
      } catch {
        toast.success('Enlace generado');
      }
      setPlannerEmail('');
    } catch (err) {
      console.error(err);
      toast.error('Error creando invitaci\u00F3n');
    } finally {
      setInviteLoading(false);
    }
  };

  const saveProfile = async () => {
    const uid = fallbackUid;
    if (!uid) {
      toast.error('No se pudo determinar tu usuario');
      return;
    }
    // Validaciones rÃpidas
    try {
      if (account.email && !/^\S+@\S+\.\S+$/.test(account.email)) {
        toast.error('Correo electrnico invÃlido');
        return;
      }
      if (account.whatsNumber && !/^\+?[0-9]{8,15}$/.test(account.whatsNumber.trim())) {
        toast.error('WhatsApp debe tener formato internacional, e.g. +349XXXXXXXX');
        return;
      }
      if (weddingInfo.weddingDate) {
        const d = new Date(weddingInfo.weddingDate);
        if (isNaN(d.getTime())) {
          toast.error('Fecha de boda invÃlida');
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
      toast.success('Perfil guardado');
      try {
        setLastSavedAt(new Date());
      } catch {}
    } catch (e) {
      console.error(e);
      toast.error('Error al guardar el perfil');
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
        toast.error('Error al cargar el perfil');
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
        <h2 className="text-lg font-medium">{t('profile.account.title', { defaultValue: 'InformaciÃ³n de la cuenta' })}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nombre" name="name" value={account.name} onChange={handleAccountChange} />
          <Input
            label="Cuenta vinculada"
            name="linkedAccount"
            value={account.linkedAccount}
            onChange={handleAccountChange}
          />
          <Input
            label="Wedding planner vinculada"
            name="planner"
            value={account.planner}
            onChange={handleAccountChange}
          />
          <Input
            label="Ayudantes vinculados"
            name="helpers"
            value={account.helpers}
            onChange={handleAccountChange}
          />
          <Input
            label={'Correo electr\u00F3nico'}
            name="email"
            type="email"
            value={account.email}
            onChange={handleAccountChange}
          />
          <Input
            label={'N\u00FAmero WhatsApp personal'}
            name="whatsNumber"
            placeholder="+34xxxxxxxxx"
            value={account.whatsNumber}
            onChange={handleAccountChange}
          />
          <Input
            label={'Reestablecer contrase\u00F1a'}
            name="password"
            type="password"
            value={account.password}
            onChange={handleAccountChange}
          />
        </div>
        <div className="text-right">
          <Button onClick={saveProfile}>{t('app.save', { defaultValue: 'Guardar' })}</Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-medium">{t('profile.wedding.title', { defaultValue: 'InformaciÃ³n de la boda' })}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nombre de la pareja"
            name="coupleName"
            value={weddingInfo.coupleName}
            onChange={handleWeddingChange}
          />
          <Input
            label={'Lugar de la celebraci\u00F3n'}
            name="celebrationPlace"
            value={weddingInfo.celebrationPlace}
            onChange={handleWeddingChange}
          />
          <Input
            label={'Direcci\u00F3n de la celebraci\u00F3n'}
            name="celebrationAddress"
            value={weddingInfo.celebrationAddress}
            onChange={handleWeddingChange}
          />
          <Input
            label="Lugar del banquete"
            name="banquetPlace"
            value={weddingInfo.banquetPlace}
            onChange={handleWeddingChange}
          />
          <Input
            label={'Direcci\u00F3n del banquete'}
            name="receptionAddress"
            value={weddingInfo.receptionAddress}
            onChange={handleWeddingChange}
          />
          <Input
            label={'Horario (ceremonia/recepci\u00F3n)'}
            name="schedule"
            value={weddingInfo.schedule}
            onChange={handleWeddingChange}
          />
          <Input
            label="Fecha de la boda"
            name="weddingDate"
            type="date"
            value={weddingInfo.weddingDate}
            onChange={handleWeddingChange}
          />
          <Input
            label={'Fecha l\u00EDmite RSVP'}
            name="rsvpDeadline"
            type="date"
            value={weddingInfo.rsvpDeadline}
            onChange={handleWeddingChange}
          />
          <Input
            label="Cuenta de regalos"
            name="giftAccount"
            value={weddingInfo.giftAccount}
            onChange={handleWeddingChange}
          />
          <Input
            label={'Transporte / alojamiento'}
            name="transportation"
            value={weddingInfo.transportation}
            onChange={handleWeddingChange}
          />
          <Input
            label={'Estilo de la boda'}
            name="weddingStyle"
            value={weddingInfo.weddingStyle}
            onChange={handleWeddingChange}
          />
          <Input
            label={'Paleta de colores (web)'}
            name="colorScheme"
            placeholder="Blanco y dorado"
            value={weddingInfo.colorScheme}
            onChange={handleWeddingChange}
          />
          <Input
            label={'N\u00FAmero de invitados'}
            name="numGuests"
            type="number"
            value={weddingInfo.numGuests}
            readOnly
          />
        </div>
        <div className="text-right">
          <Button onClick={saveProfile}>{t('app.save', { defaultValue: 'Guardar' })}</Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-medium">{t('profile.wedding.important', { defaultValue: 'InformaciÃ³n importante de la boda' })}</h2>
        <textarea
          className="w-full min-h-[150px] border rounded-md p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={
            'Datos o detalles clave (alergias, proveedores cr\u00EDticos, horarios especiales, etc.)'
          }
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
          Colaboradores
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
                      <option value="owner">Pareja</option>
                      <option value="planner">Wedding Planner</option>
                      <option value="helper">Ayudante</option>
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
        <h2 className="text-lg font-medium">{t('profile.billing.title', { defaultValue: 'Datos de facturacin' })}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nombre completo"
            name="fullName"
            value={billing.fullName}
            onChange={handleBillingChange}
          />
          <Input
            label={'Direcci\u00F3n'}
            name="address"
            value={billing.address}
            onChange={handleBillingChange}
          />
          <Input label="CP" name="zip" value={billing.zip} onChange={handleBillingChange} />
          <Input
            label="Localidad"
            name="city"
            value={billing.city}
            onChange={handleBillingChange}
          />
          <Input
            label="Provincia"
            name="state"
            value={billing.state}
            onChange={handleBillingChange}
          />
          <Input
            label={'Pa\u00EDs'}
            name="country"
            value={billing.country}
            onChange={handleBillingChange}
          />
          <Input label="DNI" name="dni" value={billing.dni} onChange={handleBillingChange} />
        </div>
        <div className="text-right">
          <Button onClick={saveProfile}>{t('app.save', { defaultValue: 'Guardar' })}</Button>
        </div>
      </Card>
    </div>
  );
}

export default Perfil;

