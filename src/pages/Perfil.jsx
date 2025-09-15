import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui';
import { Button } from '../components/ui';
import { Input } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import useRoles from '../hooks/useRoles';
import { Users, X } from 'lucide-react';

import { auth, db } from '../firebaseConfig'; // respaldo para UID
import 'react-toastify/dist/ReactToastify.css';
import { invitePlanner, getWeddingIdForOwner } from '../services/WeddingService';
import { subscribeSyncState, getSyncState } from '../services/SyncService';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// ---------------------- NUEVO PERFIL -----------------------
function Perfil() {
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
    banquetPlace: '',
    schedule: '',
    giftAccount: '',
    weddingDate: '',
    numGuests: '',
  });
  // Campo de texto amplio para notas importantes de la boda
  const [importantInfo, setImportantInfo] = useState('');
  const [syncStatus, setSyncStatus] = useState(getSyncState());
  const [plannerEmail, setPlannerEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  // Sincronizar número de invitados automáticamente
  // Escucha cambios en la lista de invitados en tiempo real
  useEffect(() => {
    function updateGuestCount() {
      let guests = [];
      try {
        guests = JSON.parse(localStorage.getItem('lovendaGuests'));
        if (!Array.isArray(guests)) guests = null;
      } catch { guests = null; }
      if (!guests) {
        guests = [
          { id: 1, name: 'Ana García', phone: '123456789', address: 'Calle Sol 1', companion: 1, table: '5', response: 'Sí' },
          { id: 2, name: 'Luis Martínez', phone: '987654321', address: 'Av. Luna 3', companion: 0, table: '', response: 'Pendiente' },
        ];
      }
      const total = guests.reduce((acc, g) => acc + 1 + (parseInt(g.companion)||0), 0);
      setWeddingInfo(w => ({ ...w, numGuests: total }));
    }
    updateGuestCount(); // inicial
    window.addEventListener('lovenda-guests', updateGuestCount);
    return () => window.removeEventListener('lovenda-guests', updateGuestCount);
   }, []);

  // Escucha notas importantes agregadas desde el chat
  useEffect(() => {
    function updateNotes() {
      setImportantInfo(loadData('importantNotes'));
    }
    window.addEventListener('lovenda-important-note', updateNotes);
    return () => window.removeEventListener('lovenda-important-note', updateNotes);
  }, []);

  const [billing, setBilling] = useState({
    fullName: '',
    address: '',
    zip: '',
    city: '',
    state: '',
    country: '',
    dni: '',
  });

  const { userProfile, user: authUser } = useAuth();
  // UID de respaldo usando Firebase Auth (en caso de que useAuth no tenga usuario)
  const fallbackUid = authUser?.uid || auth.currentUser?.uid || null;
  const weddingId = userProfile?.weddingId || '';
  const { roles: collaborators, loading: rolesLoading, assignRole, removeRole } = useRoles(weddingId);

  const handleAccountChange = (e) => setAccount({ ...account, [e.target.name]: e.target.value });
  const handleWeddingChange = (e) => setWeddingInfo({ ...weddingInfo, [e.target.name]: e.target.value });
  const handleBillingChange = (e) => setBilling({ ...billing, [e.target.name]: e.target.value });

  const handleCreateInvite = async () => {

    if (!plannerEmail) return;
    let wid = weddingId;
    const effectiveUid = fallbackUid;
  if (!wid && !effectiveUid) {
      toast.error('Tu sesión aún no está lista. Espera unos segundos e inténtalo de nuevo.');
      return;
    }
    if (!wid) {
      // intentar obtener la boda directamente de Firestore por owner
      wid = await getWeddingIdForOwner(effectiveUid);
      if (!wid) {
        toast.error('No se encontró tu boda. Completa el tutorial o contacta soporte.');
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
        toast.success('Enlace copiado al portapapeles');
      } catch {
        toast.success('Enlace generado');
      }
      setPlannerEmail('');
    } catch (err) {
      console.error(err);
      toast.error('Error creando invitación');
    } finally {
      setInviteLoading(false);
    }
  };

  const saveProfile = async () => {
    const uid = fallbackUid;
    if (!uid) {
      toast.error('No se pudo determinar tu usuario.');
      return;
    }

    try {
      // 1. Datos globales del usuario
      await setDoc(
        doc(db, 'users', uid),
        {
          account,
          subscription,
          billing,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 2. Datos específicos de la boda
      if (weddingId) {
        await updateDoc(doc(db, 'weddings', weddingId), {
          weddingInfo: { ...weddingInfo, importantInfo },
        });
      }

      toast.success('Perfil guardado');
    } catch (error) {
      console.error('Error guardando perfil:', error);
      toast.error('Error al guardar el perfil');
    }
  };

  useEffect(() => {
    // Suscribirse a cambios en el estado de sincronización
    const unsubscribe = subscribeSyncState(setSyncStatus);
    
    // Cargar datos con la nueva estrategia híbrida
    const loadProfileData = async () => {
      const uid = fallbackUid;
      if (!uid) return;
      try {
        // Datos globales
        const userSnap = await getDoc(doc(db, 'users', uid));
        if (userSnap.exists()) {
          const d = userSnap.data();
          if (d.account) setAccount(prev=>({ ...prev, ...d.account }));
          if (d.subscription) setSubscription(d.subscription);
          if (d.billing) setBilling(d.billing);
        }

        // Datos de la boda
        if (weddingId) {
          const wedSnap = await getDoc(doc(db, 'weddings', weddingId));
          if (wedSnap.exists() && wedSnap.data().weddingInfo) {
            const wi = wedSnap.data().weddingInfo;
            setWeddingInfo({
              coupleName: wi.coupleName || '',
              celebrationPlace: wi.celebrationPlace || '',
              banquetPlace: wi.banquetPlace || '',
              schedule: wi.schedule || '',
              giftAccount: wi.giftAccount || '',
              weddingDate: wi.weddingDate || '',
          numGuests: wi.numGuests || '',
            });
            if (wi.importantInfo) setImportantInfo(wi.importantInfo);
          }
        }
      } catch (error) {
        console.error('Error cargando datos del perfil:', error);
        toast.error('Error al cargar el perfil');
      }
    };
    
    loadProfileData();
    
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6 p-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Perfil</h1>
        
        {/* Indicador de estado de sincronización */}
        <div className="flex items-center text-sm">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            !syncStatus.isOnline ? 'bg-red-500' : 
            syncStatus.isSyncing ? 'bg-yellow-500' :
            syncStatus.pendingChanges ? 'bg-orange-500' : 'bg-green-500'
          }`}></div>
          <span>
            {!syncStatus.isOnline ? 'Sin conexión (modo offline)' : 
             syncStatus.isSyncing ? 'Sincronizando...' : 
             syncStatus.pendingChanges ? 'Cambios pendientes' : 'Sincronizado'}
          </span>
        </div>
      </div>

      {/* Suscripción */}
      <Card className="space-y-4">
        <h2 className="text-lg font-medium">Tipo de suscripción</h2>
        <div className="flex gap-4">
          <Button variant={subscription === 'free' ? 'primary' : 'outline'} onClick={() => setSubscription('free')}>Gratis</Button>
          <Button variant={subscription === 'premium' ? 'primary' : 'outline'} onClick={() => setSubscription('premium')}>Premium</Button>
        </div>
      </Card>

      {/* Información de la cuenta */}
      <Card className="space-y-4">
        <h2 className="text-lg font-medium">Información de la cuenta</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nombre" name="name" value={account.name} onChange={handleAccountChange} />
          <Input label="Cuenta vinculada" name="linkedAccount" value={account.linkedAccount} onChange={handleAccountChange} />
          <Input label="Wedding planner vinculada" name="planner" value={account.planner} onChange={handleAccountChange} />
          <Input label="Ayudantes vinculados" name="helpers" value={account.helpers} onChange={handleAccountChange} />
          <Input label="Correo electrónico" name="email" type="email" value={account.email} onChange={handleAccountChange} />
          <Input label="Número WhatsApp personal" name="whatsNumber" placeholder="+34xxxxxxxxx" value={account.whatsNumber} onChange={handleAccountChange} />
          <Input label="Reestablecer contraseña" name="password" type="password" value={account.password} onChange={handleAccountChange} />
        </div>
        <div className="text-right">
          <Button onClick={saveProfile}>Guardar</Button>
        </div>
      </Card>

      {/* Información de la boda */}
      <Card className="space-y-4">
        <h2 className="text-lg font-medium">Información de la boda</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nombre de la pareja" name="coupleName" value={weddingInfo.coupleName} onChange={handleWeddingChange} />
          <Input label="Lugar de la celebración" name="celebrationPlace" value={weddingInfo.celebrationPlace} onChange={handleWeddingChange} />
          <Input label="Lugar del banquete" name="banquetPlace" value={weddingInfo.banquetPlace} onChange={handleWeddingChange} />
          <Input label="Horario" name="schedule" value={weddingInfo.schedule} onChange={handleWeddingChange} />
          <Input label="Fecha de la boda" name="weddingDate" type="date" value={weddingInfo.weddingDate} onChange={handleWeddingChange} />
          <Input label="Cuenta de regalos" name="giftAccount" value={weddingInfo.giftAccount} onChange={handleWeddingChange} />
          <Input label="Número de invitados" name="numGuests" type="number" value={weddingInfo.numGuests} readOnly />
        </div>
        <div className="text-right">
          <Button onClick={saveProfile}>Guardar</Button>
        </div>
      </Card>

      {/* Información importante de la boda */}
      <Card className="space-y-4">
        <h2 className="text-lg font-medium">Información importante de la boda</h2>
        <textarea
          className="w-full min-h-[150px] border rounded-md p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Datos o detalles clave que la IA o el usuario quieran guardar (ej.: alergias, proveedores críticos, horarios especiales, etc.)"
          value={importantInfo}
          onChange={(e)=>setImportantInfo(e.target.value)}
        />
        <div className="text-right">
          <Button onClick={saveProfile}>Guardar</Button>
        </div>
      </Card>

      {/* Colaboradores */}
      <Card className="space-y-4">
        <h2 className="text-lg font-medium flex items-center"><Users className="w-5 h-5 mr-2" />Colaboradores</h2>
          {/* Invitación a wedding planner */}
          <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
            <Input
              placeholder="Email del planner"
              value={plannerEmail}
              onChange={(e)=>setPlannerEmail(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleCreateInvite} disabled={inviteLoading || !plannerEmail}>
              {inviteLoading ? 'Creando...' : 'Crear enlace'}
            </Button>
          </div>
          {inviteLink && (
            <p className="text-sm text-green-700 break-all mb-4 select-all">
              Enlace generado: <span className="underline">{inviteLink}</span>
            </p>
          )}
        {rolesLoading ? (
          <p>Cargando...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Usuario</th>
                <th className="text-left p-2">Rol</th>
                <th className="p-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {collaborators.map(c => (
                <tr key={c.uid} className="border-b">
                  <td className="p-2">{c.email || c.uid}</td>
                  <td className="p-2">
                    <select
                      value={c.role}
                      onChange={(e)=>assignRole(c.uid, e.target.value)}
                      disabled={c.role==='owner'}
                      className="border rounded px-2 py-1 text-sm">
                      <option value="owner">Pareja</option>
                      <option value="planner">Wedding Planner</option>
                      <option value="helper">Ayudante</option>
                    </select>
                  </td>
                  <td className="p-2 text-center">
                    {c.role!=='owner' && (
                      <button onClick={()=>removeRole(c.uid)} className="text-red-500 hover:text-red-700">
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

      {/* Datos de facturación */}
      <Card className="space-y-4">
        <h2 className="text-lg font-medium">Datos de facturación</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nombre completo" name="fullName" value={billing.fullName} onChange={handleBillingChange} />
          <Input label="Dirección" name="address" value={billing.address} onChange={handleBillingChange} />
          <Input label="CP" name="zip" value={billing.zip} onChange={handleBillingChange} />
          <Input label="Localidad" name="city" value={billing.city} onChange={handleBillingChange} />
          <Input label="Provincia" name="state" value={billing.state} onChange={handleBillingChange} />
          <Input label="País" name="country" value={billing.country} onChange={handleBillingChange} />
          <Input label="DNI" name="dni" value={billing.dni} onChange={handleBillingChange} />
        </div>
        <div className="text-right">
          <Button onClick={saveProfile}>Guardar</Button>
        </div>
      </Card>
    </div>
  );
}

export default Perfil;

