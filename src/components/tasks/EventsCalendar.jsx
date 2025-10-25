import React from 'react';
import { useWedding } from '../../context/WeddingContext';
import { formatDate } from '../../utils/formatUtils';

export default function EventsCalendar({
  currentView,
  setCurrentView,
  calendarDate,
  setCalendarDate,
  containerHeight,
  monthLabel,
  safeEvents,
  sortedEvents,
  categories,
  onEventEdit,
  completedSet,
  onToggleComplete,
  ErrorBoundaryComponent,
  localizer,
  eventStyleGetter,
  EventComponent,
}) {
  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-surface)] rounded-xl shadow-md p-6 overflow-x-auto border border-[color:var(--color-text)]/10">
      <h2 className="text-xl font-semibold mb-4">Calendario de Eventos</h2>

      <div className="flex justify-between items-center mb-4">
        <div className="space-x-2">
          <button
            className={`px-3 py-1 rounded ${currentView === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setCurrentView('month')}
          >
            Mes
          </button>
          <button
            className={`px-3 py-1 rounded ${currentView === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setCurrentView('week')}
          >
            Semana
          </button>
          <button
            className={`px-3 py-1 rounded ${currentView === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setCurrentView('day')}
          >
            Día
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
            onClick={() => {
              const newDate = new Date(calendarDate);
              if (currentView === 'month') newDate.setMonth(newDate.getMonth() - 1);
              else if (currentView === 'week') newDate.setDate(newDate.getDate() - 7);
              else newDate.setDate(newDate.getDate() - 1);
              setCalendarDate(newDate);
            }}
          >
            &#8592; Anterior
          </button>
          <button
            className="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200"
            onClick={() => setCalendarDate(new Date())}
          >
            Hoy
          </button>
          <button
            className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
            onClick={() => {
              const newDate = new Date(calendarDate);
              if (currentView === 'month') newDate.setMonth(newDate.getMonth() + 1);
              else if (currentView === 'week') newDate.setDate(newDate.getDate() + 7);
              else newDate.setDate(newDate.getDate() + 1);
              setCalendarDate(newDate);
            }}
          >
            Siguiente &#8594;
          </button>
        </div>
      </div>

      <div className="rbc-calendar-container">
        <ErrorBoundaryComponent
          fallback={
            <div>
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Error al cargar el calendario
                </h3>
                <p className="text-gray-600">
                  Hubo un problema al cargar el calendario. Puedes gestionar tus eventos a través de
                  la lista inferior.
                </p>
              </div>
              <div className="space-y-4 max-h-[300px] overflow-y-auto p-2">
                {safeEvents && safeEvents.length > 0 ? (
                  sortedEvents.map((event) => {
                    const eventId = event.id || '';
                    const eventTitle = event.title || event.name || 'Evento sin título';
                    const eventStart = event.start instanceof Date ? event.start : new Date();
                    const formattedDate = formatDate(eventStart, 'custom');
                    return (
                      <div
                        key={eventId}
                        className="flex items-center p-3 border rounded-md hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => onEventEdit(event)}
                      >
                        <div className="mr-3">
                          <input
                            type="checkbox"
                            checked={completedSet ? completedSet.has(String(eventId)) : false}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (typeof onToggleComplete === 'function') {
                                onToggleComplete(String(eventId), e.target.checked);
                              }
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className={`font-medium`}>{eventTitle}</div>
                          <div className="text-xs text-gray-500">{formattedDate}</div>
                        </div>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: categories[event.category || 'OTROS']?.color || '#ccc',
                          }}
                        />
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500">No hay tareas disponibles</div>
                )}
              </div>
            </div>
          }
        >
          <div
            className="calendar-container"
            style={{ height: `${containerHeight}px`, overflow: 'hidden' }}
          >
            <style>{`
              .calendar-container { display: flex; flex-direction: column; min-height: 0; }
              .calendar-container .rbc-calendar { width: 100%; height: 100%; flex: 1 1 auto; border: 1px solid #ddd; border-radius: 4px; }
              .calendar-container .rbc-toolbar { display: none; }
              .calendar-container .rbc-month-view { height: 100%; min-height: 0; display: flex; flex-direction: column; flex: 1 0 0; }
              .calendar-container .rbc-month-header { display: flex; flex-direction: row; font-weight: bold; background-color: #f8f9fa; border-bottom: 1px solid #ddd; }
              .calendar-container .rbc-header { padding: 8px 3px; text-align: center; border-bottom: 1px solid #ddd; flex: 1 0; }
              .calendar-container .rbc-month-row { display: flex; flex-direction: column; min-height: 0; overflow: hidden; flex: 1; }
              .calendar-container .rbc-day-bg { flex: 1 0; border-bottom: 1px solid #eee; border-left: 1px solid #eee; cursor: pointer; }
              .calendar-container .rbc-date-cell { padding: 4px 5px 0 0; text-align: right; font-size: 0.9em; }
              .calendar-container .rbc-row-segment { padding: 0 1px 1px 1px; }
              .calendar-container .rbc-event { border-radius: 3px; font-size: 0.85em; padding: 2px 5px; margin: 1px 2px; }
              .calendar-container .rbc-month-view .rbc-month-row { height: 100% !important; display: flex !important; flex: 1 1 0 !important; flex-flow: column !important; }
              .calendar-container .rbc-row-content { flex: 1 1 0; display: flex; flex-direction: column; min-height: 0; width: 100%; }
              .calendar-container .rbc-row { display: flex; flex: 1 1 0; width: 100%; }
            `}</style>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm md:text-base font-semibold text-gray-700 select-none">
                {monthLabel}
              </div>
            </div>
            <Calendar
              localizer={localizer}
              events={safeEvents}
              date={calendarDate}
              onNavigate={(date) => setCalendarDate(date)}
              startAccessor="start"
              endAccessor="end"
              views={{ month: true, week: true, day: true }}
              view={currentView}
              onView={setCurrentView}
              toolbar={false}
              popup={true}
              eventPropGetter={eventStyleGetter}
              components={{ event: EventComponent }}
              culture="es"
              onDoubleClickEvent={(event) => onEventEdit(event)}
              messages={{
                next: 'Siguiente',
                previous: 'Anterior',
                today: 'Hoy',
                month: 'Mes',
                week: 'Semana',
                day: 'Día',
              }}
            />
          </div>
        </ErrorBoundaryComponent>
      </div>
    </div>
  );
}
