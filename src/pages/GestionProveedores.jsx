import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  getFirestore,
} from 'firebase/firestore';
import { Sparkles, Plus, Settings } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Firebase

import AIBusquedaModal from '../components/proveedores/AIBusquedaModal';
import ProveedorCardNuevo from '../components/proveedores/ProveedorCardNuevo';

// Componentes
import ProveedorDetalle from '../components/proveedores/ProveedorDetalle';
import ProveedorFiltro from '../components/proveedores/ProveedorFiltro';
import ProveedorFormModal from '../components/proveedores/ProveedorFormModal';
import ProviderSearchDrawer from '../components/proveedores/ProviderSearchDrawer';
import ServicesBoard from '../components/proveedores/ServicesBoard';
import SupplierKanban from '../components/proveedores/SupplierKanban';
import { useWedding } from '../context/WeddingContext';
import useActiveWeddingInfo from '../hooks/useActiveWeddingInfo';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { post as apiPost } from '../services/apiClient';
import Modal from '../components/Modal';

/**
 * Página de gestión de proveedores
 * Muestra proveedores en tarjetas, permite filtrar, buscar con IA y añadir manualmente
 */
const GestionProveedores = () => {
  // Contextos
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { activeWedding } = useWedding();
  const { info: weddingDoc } = useActiveWeddingInfo();

  // Estaños para proveedores
  const [proveedores, setProveedores] = useState([]);
  const [proveedoresFiltraños, setProveedoresFiltraños] = useState([]);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estaños para filtros y búsqueda
  const [filtroActivo, setFiltroActivo] = useState('todos');
  const [textoBusqueda, setTextoBusqueda] = useState('');

  // Estaños para modales
  const [modalFormularioVisible, setModalFormularioVisible] = useState(false);
  const [modalAIVisible, setModalAIVisible] = useState(false);
  const [proveedorEditar, setProveedorEditar] = useState(null);
  const [needsModalOpen, setNeedsModalOpen] = useState(false);

  // Estaños para búsqueda IA
  const [resultadoBusquedaIA, setResultadoBusquedaIA] = useState(null);
  const [cargandoBusquedaIA, setCargandoBusquedaIA] = useState(false);
  const [drawerBusquedaOpen, setDrawerBusquedaOpen] = useState(false);

  // Estado para comunicaciones
  const [comunicaciones, setComunicaciones] = useState([]);

  // Cargar proveedores desde Firestore
  const cargarProveedores = useCallback(async () => {
    // Usar ID de usuario por defecto si no hay usuario autenticado (solo para desarrollo)
    const userId = currentUser?.uid || 'user123';
    console.log('cargarProveedores: usando ID de usuario:', userId);

    setCargando(true);
    setError(null);

    try {
      const proveedoresRef = collection(db, `users/${userId}/proveedores`);
      const q = query(proveedoresRef);
      const snapshot = await getDocs(q);

      const nuevosProveedores = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProveedores(nuevosProveedores);
      aplicarFiltros(nuevosProveedores, filtroActivo, textoBusqueda);

      setCargando(false);
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
      setError('Error al cargar los proveedores. Inténtalo de nuevo más tarde.');
      setCargando(false);
    }
  }, [currentUser, filtroActivo, textoBusqueda]);

  // Cargar al iniciar
  useEffect(() => {
    cargarProveedores();
  }, [cargarProveedores]);

  // Aplicar filtros a los proveedores
  const aplicarFiltros = (listaProveedores, filtro, texto) => {
    let resultado = [...listaProveedores];

    // Aplicar filtro por categoría
    switch (filtro) {
      case 'contrataños':
        resultado = resultado.filter((p) => p.estado === 'Contratado');
        break;
      case 'contactaños':
        resultado = resultado.filter((p) => p.estado === 'Contactado');
        break;
      case 'favoritos':
        resultado = resultado.filter((p) => p.favorito === true);
        break;
      default:
        // Todos los proveedores
        break;
    }

    // Aplicar filtro de texto si existe
    if (texto) {
      const textoLower = texto.toLowerCase();
      resultado = resultado.filter(
        (p) =>
          (p.nombre && p.nombre.toLowerCase().includes(textoLower)) ||
          (p.servicio && p.servicio.toLowerCase().includes(textoLower)) ||
          (p.ubicacion && p.ubicacion.toLowerCase().includes(textoLower))
      );
    }

    setProveedoresFiltraños(resultado);
  };

  // Cambiar filtro activo
  const cambiarFiltro = (nuevoFiltro) => {
    setFiltroActivo(nuevoFiltro);
    aplicarFiltros(proveedores, nuevoFiltro, textoBusqueda);
  };

  // Cambiar texto de búsqueda
  const cambiarTextoBusqueda = (nuevoTexto) => {
    setTextoBusqueda(nuevoTexto);
  };

  // Realizar búsqueda
  const buscar = () => {
    aplicarFiltros(proveedores, filtroActivo, textoBusqueda);
  };

  // Guardar nuevo proveedor
  const guardarProveedor = async (dañosProveedor) => {
    console.log('guardarProveedor llamado con daños:', dañosProveedor);

    // Usar ID de usuario por defecto si no hay usuario autenticado (solo para desarrollo)
    const userId = currentUser?.uid || 'user123';
    console.log('Usando ID de usuario:', userId);

    try {
      console.log('Intentando guardar proveedor en Firestore...');
      // Si tiene ID, actualizar
      if (dañosProveedor.id) {
        console.log('Actualizando proveedor existente con ID:', dañosProveedor.id);
        const proveedorRef = doc(db, `users/${userId}/proveedores`, dañosProveedor.id);
        const { id, ...dañosActualizar } = dañosProveedor;
        await updateDoc(proveedorRef, dañosActualizar);
        // Proveedor actualizado correctamente
      } else {
        // Si no tiene ID, crear nuevo
        // Creando nuevo proveedor
        const proveedoresRef = collection(db, `users/${userId}/proveedores`);
        const docRef = await addDoc(proveedoresRef, {
          ...dañosProveedor,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log('Proveedor creado con ID:', docRef.id);
      }

      // Recargar proveedores
      console.log('Recargando lista de proveedores...');
      await cargarProveedores();
      console.log('Lista de proveedores recargada');

      return true;
    } catch (error) {
      console.error('Error al guardar proveedor:', error);
      throw error;
    }
  };

  // Eliminar proveedor
  const eliminarProveedor = async (proveedorId) => {
    if (!currentUser?.uid || !proveedorId) return;

    if (!window.confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
      return;
    }

    try {
      const proveedorRef = doc(db, `users/${currentUser.uid}/proveedores`, proveedorId);
      await deleteDoc(proveedorRef);

      // Actualizar estado local
      setProveedores((prev) => prev.filter((p) => p.id !== proveedorId));
      setProveedoresFiltraños((prev) => prev.filter((p) => p.id !== proveedorId));

      // Si era el proveedor seleccionado, deseleccionar
      if (proveedorSeleccionado?.id === proveedorId) {
        setProveedorSeleccionado(null);
      }
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      alert('Error al eliminar el proveedor');
    }
  };

  // Marcar/desmarcar favorito
  const toggleFavorito = async (proveedorId) => {
    if (!currentUser?.uid || !proveedorId) return;

    try {
      // Encontrar el proveedor en la lista
      const proveedor = proveedores.find((p) => p.id === proveedorId);
      if (!proveedor) return;

      // Actualizar en Firestore
      const proveedorRef = doc(db, `users/${currentUser.uid}/proveedores`, proveedorId);
      await updateDoc(proveedorRef, {
        favorito: !proveedor.favorito,
        updatedAt: new Date().toISOString(),
      });

      // Actualizar estado local
      setProveedores((prev) =>
        prev.map((p) => (p.id === proveedorId ? { ...p, favorito: !p.favorito } : p))
      );

      // Actualizar filtraños también
      setProveedoresFiltraños((prev) =>
        prev.map((p) => (p.id === proveedorId ? { ...p, favorito: !p.favorito } : p))
      );

      // Si es el proveedor seleccionado, actualizar
      if (proveedorSeleccionado?.id === proveedorId) {
        setProveedorSeleccionado((prev) => ({ ...prev, favorito: !prev.favorito }));
      }
    } catch (error) {
      console.error('Error al marcar favorito:', error);
    }
  };

  // Editar proveedor
  const editarProveedor = (proveedor) => {
    setProveedorEditar(proveedor);
    setModalFormularioVisible(true);
  };

  // Ver detalle del proveedor
  const verDetalleProveedor = async (proveedor) => {
    setProveedorSeleccionado(proveedor);

    // Cargar comunicaciones para este proveedor
    try {
      if (currentUser?.uid && proveedor?.id) {
        const comunicacionesRef = collection(
          db,
          `users/${currentUser.uid}/proveedores/${proveedor.id}/comunicaciones`
        );
        const snapshot = await getDocs(comunicacionesRef);

        const nuevasComunicaciones = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => {
            // Ordenar por fecha descendente
            return new Date(b.fecha) - new Date(a.fecha);
          });

        setComunicaciones(nuevasComunicaciones);
      }
    } catch (error) {
      console.error('Error al cargar comunicaciones:', error);
      setComunicaciones([]);
    }
  };

  // Cerrar detalle
  const cerrarDetalle = () => {
    setProveedorSeleccionado(null);
    setComunicaciones([]);
  };

  // Añadir nueva comunicación
  const nuevaComunicacion = async () => {
    // Aquí iría un modal para añadir comunicación
    alert('Funcionalidad de añadir comunicación en desarrollo');
  };

  // Buscar con IA
  const buscarConIA = async (consulta) => {
    if (!consulta) return;

    setCargandoBusquedaIA(true);
    setResultadoBusquedaIA(null);

    try {
      // Simular búsqueda con IA (reemplazar con llamada real a API)
      setTimeout(() => {
        // Resultado simulado
        const resultado = {
          nombre: `Proveedor para: ${consulta}`,
          servicio: consulta.split(' ')[0] || 'Servicio',
          descripcion: `Este es un proveedor encontrado para tu búsqueda: "${consulta}". Aquí iría una descripción generada por IA con información relevante sobre el proveedor.`,
          web: 'https://ejemplo.com',
          ubicacion: 'Madrid, España',
          contacto: 'Persona de contacto',
          email: 'contacto@ejemplo.com',
          telefono: '+34 123 456 789',
        };

        setResultadoBusquedaIA(resultado);
        setCargandoBusquedaIA(false);
      }, 2000);
    } catch (error) {
      console.error('Error en búsqueda IA:', error);
      setCargandoBusquedaIA(false);
    }
  };

  // Nueva implementación real de búsqueda IA usando backend y perfil de boda
  const buscarConIAReal = async (consulta) => {
    if (!consulta) return;

    setCargandoBusquedaIA(true);
    setResultadoBusquedaIA(null);

    try {
      const ENABLE_BACKEND_AI =
        (import.meta?.env?.VITE_ENABLE_AI_SUPPLIERS || import.meta?.env?.VITE_AI_SUPPLIERS || '')
          .toString()
          .match(/^(1|true)$/i);
      const profile = (weddingDoc && (weddingDoc.weddingInfo || weddingDoc)) || {};
      const location =
        profile.celebrationPlace ||
        profile.location ||
        profile.city ||
        profile.ceremonyLocation ||
        profile.receptionVenue ||
        '';
      const budget =
        profile.budget ||
        profile.estimatedBudget ||
        profile.totalBudget ||
        '';
      const guessService = (q) => {
        const t = String(q || '').toLowerCase();
        if (t.includes('foto')) return 'Fotografía';
        if (t.includes('video')) return 'Video';
        if (t.includes('catering')) return 'Catering';
        if (t.includes('dj') || t.includes('másica')) return 'Música';
        if (t.includes('flor')) return 'Flores';
        return '';
      };

      if (!ENABLE_BACKEND_AI) {
        // Backend deshabilitado: usar flujo simulado
        const mapped = {
          nombre: `Proveedor para: ${consulta}`,
          servicio: guessService(consulta) || 'Servicio para bodas',
          descripcion: `Búsqueda local (demo) para "${consulta}" en ${location || 'España'}`,
          web: 'https://www.bodas.net',
          ubicacion: location || 'España',
          contacto: '',
          email: '',
          telefono: '',
        };
        setResultadoBusquedaIA(mapped);
        return;
      }

      const res = await apiPost('/api/ai-suppliers', { query: consulta, service: guessService(consulta), budget, profile, location, weddingId: activeWedding || '' }, { auth: true });

      if (!res.ok) throw new Error('ai-suppliers failed');
      const list = await res.json();
      if (Array.isArray(list) && list.length) {
        const item = list[0];
        const mapped = {
          nombre: item.title || item.name || 'Proveedor sugerido',
          servicio: itemáservice || guessService(consulta) || 'Servicio para bodas',
          descripcion: itemásnippet || '',
          web: item.link || '',
          ubicacion: item.location || location || '',
          contacto: item.contact || '',
          email: item.email || '',
          telefono: item.phone || '',
        };
        setResultadoBusquedaIA(mapped);
      } else {
        setResultadoBusquedaIA(null);
      }
    } catch (error) {
      console.error('Error en busqueda IA:', error);
      setResultadoBusquedaIA(null);
    } finally {
      setCargandoBusquedaIA(false);
    }
  };

  // Guardar proveedor de IA
  const guardarProveedorIA = (resultado) => {
    if (!resultado) return;

    // Pasar al formulario para completar
    setProveedorEditar({
      nombre: resultado.nombre,
      servicio: resultado.servicio,
      ubicacion: resultado.ubicacion,
      contacto: resultado.contacto,
      email: resultado.email,
      telefono: resultado.telefono,
      web: resultado.web,
      notas: resultado.descripcion,
      estado: 'Nuevo',
      favorito: false,
    });

    // Cerrar modal IA y abrir formulario
    setModalAIVisible(false);
    setDrawerBusquedaOpen(false);
    setModalFormularioVisible(true);
  };

  // Ataños de UI para tablero / drawer
  const abrirNuevoProveedorConServicio = (serv) => {
    setProveedorEditar({ servicio: serv || '', estado: 'Nuevo', favorito: false });
    setModalFormularioVisible(true);
  };

  // Mover proveedor de columna (kanban)
  const moverProveedorEstado = async (prov, targetKey) => {
    try {
      const mapLabel = {
        vacio: 'Nuevo',
        proceso: 'Contactado',
        presupuestos: 'Presupuestos',
        contratado: 'Contratado',
        rechazado: 'Rechazado',
      };
      const nuevoEstado = mapLabel[targetKey] || prov.estado || 'Nuevo';
      const userId = currentUser?.uid || 'user123';
      const ref = doc(db, `users/${userId}/proveedores`, prov.id);
      await updateDoc(ref, { estado: nuevoEstado, updatedAt: new Date().toISOString() });
      // Actualizar estado local optimásta
      setProveedores((prev) => prev.map((p) => (p.id === prov.id ? { ...p, estado: nuevoEstado } : p)));
      setProveedoresFiltraños((prev) => prev.map((p) => (p.id === prov.id ? { ...p, estado: nuevoEstado } : p)));
    } catch (e) {
      console.error('Error moviendo proveedor:', e);
    }
  };

  // KPIs y métricas globales para panel lateral
  const kpi = (() => {
    const asignado = proveedores.reduce((s, p) => s + (parseFloat(p.presupuestoAsignado || p.presupuesto) || 0), 0);
    const gastado = proveedores.reduce((s, p) => s + (parseFloat(p.gastado) || 0), 0);
    const presupPend = proveedores.filter((p) => /presup/i.test(p?.estado || '')).length;
    const deadlines = proveedores
      .map((p) => ({ p, d: p?.fechaLimite ? new Date(p.fechaLimite) : null }))
      .filter((x) => x.d && !isNaN(x.d))
      .sort((a, b) => a.d - b.d);
    const próximoDeadline = deadlines.length ? deadlines[0].d : null;
    const recordatorios = proveedores.filter((p) => !!p?.recordatorioProximo).length;
    return { asignado, gastado, presupPend, próximoDeadline, recordatorios };
  })();

  // Determinar contenido principal
  let contenidoPrincipal;

  if (error) {
    contenidoPrincipal = (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  } else if (cargando) {
    contenidoPrincipal = (
      <div className="flex justify-center itemás-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  } else if (proveedorSeleccionado) {
    // Vista detalle del proveedor
    contenidoPrincipal = (
      <ProveedorDetalle
        proveedor={proveedorSeleccionado}
        comunicaciones={comunicaciones}
        onCerrar={cerrarDetalle}
        onEditar={editarProveedor}
        onNuevaComunicacion={nuevaComunicacion}
      />
    );
  } else {
    // Nueva vista: Tablero de servicios + Kanban por estado, con panel lateral de KPIs
    contenidoPrincipal = (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-6">
        <div className="space-y-6">
          <div className="rounded-lg border border-dashed border-gray-300 bg-white/70 p-4 flex flex-wrap items-center gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-800">Organiza necesidades y servicios</div>
              <p className="text-xs text-gray-600 max-w-md">
                Usa la matriz para mapear qué servicios están cubiertos, detectar pendientes y lanzar búsquedas inteligentes.
              </p>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => setNeedsModalOpen(true)}
                className="inline-flex itemás-center px-3 py-2 border border-blue-600 text-blue-600 text-xs font-medium rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Abrir matriz de necesidades
              </button>
            </div>
          </div>

          {/* Kanban por estado */}
          <SupplierKanban
            proveedores={proveedoresFiltraños}
            onMove={moverProveedorEstado}
            onClick={verDetalleProveedor}
          />
        </div>

        {/* Panel lateral de KPIs */}
        <aside className="bg-white border rounded-lg p-4 h-min sticky top-4">
          <div className="text-sm font-semibold mb-2">Resumen financiero</div>
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Asignado</span>
              <span>€ {kpi.asignado.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Gastado</span>
              <span>€ {kpi.gastado.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Presupuestos pendientes</span>
              <span>{kpi.presupPend}</span>
            </div>
            <div className="flex justify-between">
              <span>Recordatorios</span>
              <span>{kpi.recordatorios}</span>
            </div>
            <div className="flex justify-between">
              <span>Próximo deadline</span>
              <span>{kpi.próximoDeadline ? kpi.próximoDeadline.toLocaleDateString() : '--'}</span>
            </div>
          </div>
          <div className="mt-3 border-t pt-3">
            <div className="text-sm font-semibold mb-2">Filtros globales</div>
            <ProveedorFiltro
              filtroActivo={filtroActivo}
              onCambioFiltro={cambiarFiltro}
              textoBusqueda={textoBusqueda}
              onCambioTexto={cambiarTextoBusqueda}
              onBuscar={buscar}
            />
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="sm:flex sm:itemás-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestión de Proveedores</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra todos los proveedores para tu boda
          </p>
        </div>

        {!proveedorSeleccionado && (
          <div className="mt-4 sm:mt-0 sm:ml-16 flex space-x-3">
            <button
              onClick={() => setNeedsModalOpen(true)}
              className="inline-flex itemás-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Settings className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Matriz de necesidades
            </button>
            <button
              onClick={() => setDrawerBusquedaOpen(true)}
              className="inline-flex itemás-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <Sparkles className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Buscar con IA
            </button>
            <button
              onClick={() => setModalFormularioVisible(true)}
              className="inline-flex itemás-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Añadir proveedor
            </button>
          </div>
        )}
      </div>

      {/* En la nueva vista, los filtros globales se han movido al panel lateral */}

      {/* Contenido principal */}
      {contenidoPrincipal}

      {/* Modales */}

      <ProveedorFormModal
        visible={modalFormularioVisible}
        onClose={() => {
          setModalFormularioVisible(false);
          setProveedorEditar(null);
        }}
        onGuardar={guardarProveedor}
        proveedorEditar={proveedorEditar}
      />

      <AIBusquedaModal
        visible={modalAIVisible}
        onClose={() => {
          setModalAIVisible(false);
          setResultadoBusquedaIA(null);
        }}
        onBuscar={buscarConIAReal}
      onGuardar={guardarProveedorIA}
      resultado={resultadoBusquedaIA}
      cargando={cargandoBusquedaIA}
    />

      <Modal
        open={needsModalOpen}
        onClose={() => setNeedsModalOpen(false)}
        title="Matriz de necesidades"
        size="full"
        className="max-w-5xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Revisa los servicios planificados, asigna responsables y lanza búsquedas instantáneas.
          </p>
          <ServicesBoard
            proveedores={proveedores}
            onOpenSearch={(serv) => {
              setNeedsModalOpen(false);
              setDrawerBusquedaOpen(true);
            }}
            onOpenNew={(serv) => {
              setNeedsModalOpen(false);
              abrirNuevoProveedorConServicio(serv);
            }}
            onOpenAI={(serv) => {
              setNeedsModalOpen(false);
              setDrawerBusquedaOpen(true);
            }}
          />
        </div>
      </Modal>

      {/* Drawer IA contextual */}
      <ProviderSearchDrawer
        open={drawerBusquedaOpen}
        onClose={() => setDrawerBusquedaOpen(false)}
        onBuscar={buscarConIAReal}
        onGuardar={guardarProveedorIA}
        resultado={resultadoBusquedaIA}
        cargando={cargandoBusquedaIA}
      />
    </div>
  );
};

export default GestionProveedores;
