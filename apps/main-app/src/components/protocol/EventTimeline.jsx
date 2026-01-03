import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, Play, Pause, RotateCcw } from 'lucide-react';
import Button from '../ui/Button';

/**
 * Timeline interactiva del evento con contador en tiempo real
 */
const EventTimeline = ({ events = [], startTime, onEventComplete }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLive, setIsLive] = useState(false);
  const [completedEvents, setCompletedEvents] = useState(new Set());

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive]);

  // Calcular hora de inicio de cada evento
  const getEventSchedule = () => {
    if (!startTime || events.length === 0) return [];

    const schedule = [];
    let currentEventTime = new Date(startTime);

    events.forEach((event, index) => {
      const eventStart = new Date(currentEventTime);
      const eventEnd = new Date(currentEventTime.getTime() + event.duration * 60000);

      schedule.push({
        ...event,
        index,
        scheduledStart: eventStart,
        scheduledEnd: eventEnd,
        status: getEventStatus(eventStart, eventEnd),
      });

      currentEventTime = eventEnd;
    });

    return schedule;
  };

  const getEventStatus = (start, end) => {
    if (!isLive) return 'pending';

    if (completedEvents.has(start.toISOString())) return 'completed';
    if (currentTime >= start && currentTime <= end) return 'active';
    if (currentTime > end) return 'overdue';
    return 'pending';
  };

  const handleToggleComplete = (event) => {
    const newCompleted = new Set(completedEvents);
    const key = event.scheduledStart.toISOString();

    if (completedEvents.has(key)) {
      newCompleted.delete(key);
    } else {
      newCompleted.add(key);
      if (onEventComplete) onEventComplete(event);
    }

    setCompletedEvents(newCompleted);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString(currentLanguage || 'es', { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeRemaining = (targetTime) => {
    const diff = targetTime - currentTime;
    if (diff <= 0) return 'Ahora';

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 border-green-500 text-green-900';
      case 'completed':
        return 'bg-blue-100 border-blue-500 text-blue-900';
      case 'overdue':
        return 'bg-red-100 border-red-500 text-red-900';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Play className="w-5 h-5 text-green-600" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const schedule = getEventSchedule();
  const activeEvent = schedule.find((e) => e.status === 'active');
  const nextEvent = schedule.find((e) => e.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Timeline del Evento</h2>
          {startTime && (
            <p className="text-sm text-gray-600 mt-1">
              Inicio programado: {new Date(startTime).toLocaleString('es-ES')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isLive && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-100 border border-green-500 rounded-lg">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-900">En Vivo</span>
            </div>
          )}

          <Button
            onClick={() => setIsLive(!isLive)}
            variant={isLive ? 'secondary' : 'primary'}
            className="flex items-center gap-2"
          >
            {isLive ? (
              <>
                <Pause className="w-4 h-4" />
                Pausar
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Iniciar
              </>
            )}
          </Button>

          {completedEvents.size > 0 && (
            <Button
              onClick={() => setCompletedEvents(new Set())}
              variant="ghost"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Resetear
            </Button>
          )}
        </div>
      </div>

      {/* Reloj en vivo */}
      {isLive && (
        <div className="bg-[var(--color-primary)] text-white rounded-lg p-6 text-center">
          <p className="text-sm mb-2 opacity-90">Hora Actual</p>
          <p className="text-4xl font-bold">
            {currentTime.toLocaleTimeString(currentLanguage || 'es')}
          </p>
        </div>
      )}

      {/* Evento activo */}
      {activeEvent && (
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
              <Play className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-green-900">En Curso Ahora</h3>
                <span className="text-sm text-green-700">
                  Termina en {getTimeRemaining(activeEvent.scheduledEnd)}
                </span>
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-1">{activeEvent.title}</p>
              <div className="flex items-center gap-4 text-sm text-gray-700">
                <span>
                  {formatTime(activeEvent.scheduledStart)} - {formatTime(activeEvent.scheduledEnd)}
                </span>
                <span>•</span>
                <span>{activeEvent.duration} min</span>
                {activeEvent.location && (
                  <>
                    <span>•</span>
                    <span>{activeEvent.location}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Próximo evento */}
      {!activeEvent && nextEvent && isLive && (
        <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 mb-1">Próximo Evento</p>
              <p className="font-semibold text-gray-900">{nextEvent.title}</p>
              <p className="text-sm text-gray-600">
                {formatTime(nextEvent.scheduledStart)} - {formatTime(nextEvent.scheduledEnd)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Comienza en</p>
              <p className="text-2xl font-bold text-blue-700">
                {getTimeRemaining(nextEvent.scheduledStart)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Timeline completa */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Cronograma Completo</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {schedule.map((event, index) => (
            <div
              key={index}
              className={`p-4 transition-colors ${
                event.status === 'active' ? 'bg-green-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Timeline indicator */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${getStatusColor(event.status)}`}
                  >
                    {getStatusIcon(event.status)}
                  </div>
                  {index < schedule.length - 1 && (
                    <div
                      className={`w-0.5 h-12 ${
                        event.status === 'completed' ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>

                {/* Event details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{event.title}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                        <span className="font-medium">
                          {formatTime(event.scheduledStart)} - {formatTime(event.scheduledEnd)}
                        </span>
                        <span>•</span>
                        <span>{event.duration} min</span>
                        {isLive && event.status === 'pending' && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600">
                              En {getTimeRemaining(event.scheduledStart)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {isLive && (
                      <button
                        onClick={() => handleToggleComplete(event)}
                        className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                          completedEvents.has(event.scheduledStart.toISOString())
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {completedEvents.has(event.scheduledStart.toISOString())
                          ? '✓ Completado'
                          : 'Marcar completo'}
                      </button>
                    )}
                  </div>

                  {event.location && (
                    <p className="text-sm text-gray-600 mt-1">📍 {event.location}</p>
                  )}

                  {event.participants && (
                    <p className="text-sm text-gray-600 mt-1">👥 {event.participants}</p>
                  )}

                  {event.description && (
                    <p className="text-sm text-gray-700 mt-2">{event.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">Total Eventos</p>
          <p className="text-2xl font-bold text-gray-900">{schedule.length}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">Completados</p>
          <p className="text-2xl font-bold text-blue-600">{completedEvents.size}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">Duración Total</p>
          <p className="text-2xl font-bold text-purple-600">
            {Math.floor(events.reduce((sum, e) => sum + e.duration, 0) / 60)}h{' '}
            {events.reduce((sum, e) => sum + e.duration, 0) % 60}m
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventTimeline;
