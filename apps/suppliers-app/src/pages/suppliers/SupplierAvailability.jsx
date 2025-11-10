import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, X, Plus, AlertCircle } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import useTranslations from '../../hooks/useTranslations';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4004';

export default function SupplierAvailability() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslations();

  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [blockReason, setBlockReason] = useState('');
  const [blockType, setBlockType] = useState('blocked');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadBlockedDates();
  }, [id, currentMonth]);

  const loadBlockedDates = async () => {
    try {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const token = localStorage.getItem('supplier_token');
      const response = await fetch(
        `${API_BASE}/api/supplier-availability/availability?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBlockedDates(data.blockedDates);
      }
    } catch (error) {
      console.error('Error loading blocked dates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockDates = async () => {
    if (selectedDates.length === 0) return;

    try {
      const token = localStorage.getItem('supplier_token');
      const response = await fetch(`${API_BASE}/api/supplier-availability/availability/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dates: selectedDates.map((d) => d.toISOString()),
          reason: blockReason,
          type: blockType,
        }),
      });

      if (response.ok) {
        setShowModal(false);
        setSelectedDates([]);
        setBlockReason('');
        loadBlockedDates();
      }
    } catch (error) {
      console.error('Error blocking dates:', error);
    }
  };

  const handleUnblockDate = async (dateId) => {
    try {
      const token = localStorage.getItem('supplier_token');
      await fetch(`${API_BASE}/api/supplier-availability/availability/${dateId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadBlockedDates();
    } catch (error) {
      console.error('Error unblocking date:', error);
    }
  };

  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendar = [];
    let week = [];

    // Días vacíos antes del primer día del mes
    for (let i = 0; i < startingDayOfWeek; i++) {
      week.push(null);
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      week.push(date);

      if (week.length === 7) {
        calendar.push(week);
        week = [];
      }
    }

    // Completar última semana
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      calendar.push(week);
    }

    return calendar;
  };

  const isDateBlocked = (date) => {
    if (!date) return false;
    const dateId = date.toISOString().split('T')[0];
    return blockedDates.some((blocked) => blocked.id === dateId);
  };

  const getBlockedDateInfo = (date) => {
    if (!date) return null;
    const dateId = date.toISOString().split('T')[0];
    return blockedDates.find((blocked) => blocked.id === dateId);
  };

  const toggleDateSelection = (date) => {
    if (!date) return;
    const exists = selectedDates.some(
      (d) => d.toISOString().split('T')[0] === date.toISOString().split('T')[0]
    );
    if (exists) {
      setSelectedDates(
        selectedDates.filter(
          (d) => d.toISOString().split('T')[0] !== date.toISOString().split('T')[0]
        )
      );
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const calendar = generateCalendar();
  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(`/supplier/dashboard/${id}`)}
            className="flex items-center gap-2 hover:opacity-70"
            style={{ color: 'var(--color-text)' }}
          >
            <ArrowLeft size={20} />
            <span>Volver al Dashboard</span>
          </button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
            Calendario de Disponibilidad
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg flex items-center gap-2"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          >
            <Plus size={20} />
            Bloquear Fechas
          </button>
        </div>

        {/* Calendario */}
        <div
          className="shadow-md rounded-lg p-6"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          {/* Navegación de mes */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() =>
                setCurrentMonth(
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
                )
              }
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: 'var(--color-background)' }}
            >
              ← Anterior
            </button>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <button
              onClick={() =>
                setCurrentMonth(
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                )
              }
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: 'var(--color-background)' }}
            >
              Siguiente →
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
              <div
                key={day}
                className="text-center font-semibold py-2"
                style={{ color: 'var(--color-muted)' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Días */}
          <div className="space-y-2">
            {calendar.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 gap-2">
                {week.map((date, dayIdx) => {
                  const blocked = date && isDateBlocked(date);
                  const blockInfo = date && getBlockedDateInfo(date);
                  const isPast = date && date < new Date().setHours(0, 0, 0, 0);

                  return (
                    <div
                      key={dayIdx}
                      className={`aspect-square flex items-center justify-center rounded-lg cursor-pointer relative group ${
                        !date ? 'invisible' : ''
                      } ${isPast ? 'opacity-50' : ''}`}
                      style={{
                        backgroundColor: blocked
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'var(--color-background)',
                        border: blocked ? '2px solid #ef4444' : '1px solid var(--color-border)',
                      }}
                      onClick={() =>
                        !isPast && date && (blocked ? handleUnblockDate(blockInfo.id) : null)
                      }
                    >
                      {date && (
                        <>
                          <span style={{ color: 'var(--color-text)' }}>{date.getDate()}</span>
                          {blocked && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-lg">
                              <X size={16} color="white" />
                            </div>
                          )}
                          {blockInfo && (
                            <div
                              className="absolute bottom-0 left-0 right-0 text-xs p-1 truncate text-center"
                              style={{ color: '#ef4444' }}
                            >
                              {blockInfo.type === 'booked' && '📅'}
                              {blockInfo.type === 'holiday' && '🏖️'}
                              {blockInfo.type === 'blocked' && '🚫'}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Leyenda */}
          <div
            className="mt-6 flex items-center gap-6 text-sm"
            style={{ color: 'var(--color-muted)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '2px solid #ef4444' }}
              />
              <span>Fecha bloqueada</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📅 Reservada</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🏖️ Vacaciones</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🚫 Bloqueada</span>
            </div>
          </div>
        </div>

        {/* Lista de fechas bloqueadas */}
        <div
          className="shadow-md rounded-lg p-6 mt-6"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Fechas Bloqueadas ({blockedDates.length})
          </h2>
          {blockedDates.length === 0 ? (
            <p style={{ color: 'var(--color-muted)' }}>No hay fechas bloqueadas</p>
          ) : (
            <div className="space-y-2">
              {blockedDates.map((blocked) => (
                <div
                  key={blocked.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--color-background)' }}
                >
                  <div className="flex items-center gap-3">
                    <Calendar size={20} style={{ color: 'var(--color-primary)' }} />
                    <div>
                      <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                        {new Date(blocked.date.seconds * 1000).toLocaleDateString('es-ES')}
                      </p>
                      {blocked.reason && (
                        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                          {blocked.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnblockDate(blocked.id)}
                    className="p-2 hover:opacity-70 rounded-lg"
                    style={{ color: 'var(--color-error)' }}
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de bloqueo */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className="rounded-lg p-6 max-w-2xl w-full mx-4"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
                Bloquear Fechas
              </h2>

              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  Tipo de bloqueo
                </label>
                <select
                  value={blockType}
                  onChange={(e) => setBlockType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg"
                  style={{
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-background)',
                  }}
                >
                  <option value="blocked">Bloqueada</option>
                  <option value="booked">Reservada</option>
                  <option value="holiday">Vacaciones</option>
                </select>
              </div>

              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  Motivo (opcional)
                </label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Ej: Vacaciones, evento personal..."
                  className="w-full px-3 py-2 rounded-lg"
                  style={{
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-background)',
                  }}
                />
              </div>

              <div className="mb-6">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  Selecciona las fechas ({selectedDates.length} seleccionadas)
                </label>
                <div
                  className="flex items-center gap-2 p-3 rounded-lg"
                  style={{ backgroundColor: 'rgba(109, 40, 217, 0.1)' }}
                >
                  <AlertCircle size={16} style={{ color: 'var(--color-primary)' }} />
                  <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                    Haz clic en el calendario de arriba para seleccionar las fechas que quieres
                    bloquear
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleBlockDates}
                  disabled={selectedDates.length === 0}
                  className="flex-1 px-4 py-2 rounded-lg disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                >
                  Bloquear {selectedDates.length} fecha{selectedDates.length !== 1 ? 's' : ''}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedDates([]);
                    setBlockReason('');
                  }}
                  className="px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
