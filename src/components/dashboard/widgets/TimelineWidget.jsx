import React from 'react';
import { useTranslations } from '../../hooks/useTranslations';

const TIMELINE_EVENTS = [
  {
  const { t } = useTranslations();

    id: 1,
    title: 'Ceremonia',
    time: '17:00 - 18:00',
    location: t('common.iglesia_santa_maria'),
    completed: true,
    current: false,
  },
  {
    id: 2,
    title: t('common.coctel_bienvenida'),
    time: '18:30 - 20:00',
    location: 'Jardines del Palacio',
    completed: true,
    current: false,
  },
  {
    id: 3,
    title: 'Cena de gala',
    time: '20:30 - 23:00',
    location: t('common.salon_eventos'),
    completed: false,
    current: true,
  },
  {
    id: 4,
    title: 'Baile y fiesta',
    time: '23:00 - 02:00',
    location: 'Sala de baile',
    completed: false,
    current: false,
  },
  {
    id: 5,
    title: 'Despedida',
    time: '02:30',
    location: '',
    completed: false,
    current: false,
  },
];

export const TimelineWidget = ({ config }) => {
  return (
    <div className="h-full">
      <div
        className="relative
        after:absolute
        after:top-0
        after:bottom-0
        after:left-4
        after:w-0.5
        after:bg-gray-200
        after:content-['']
      "
      >
        {TIMELINE_EVENTS.map((event, index) => (
          <div key={event.id} className="relative pl-8 pb-6 group">
            <div
              className={`absolute left-0 z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                event.completed
                  ? 'bg-green-500 text-white'
                  : event.current
                    ? 'bg-blue-500 text-white ring-4 ring-blue-200'
                    : 'bg-white border-2 border-gray-300 text-gray-400'
              }`}
            >
              {event.completed ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <span className="font-medium">{index + 1}</span>
              )}
            </div>
            <div
              className={`p-3 rounded-lg ${
                event.current
                  ? 'bg-blue-50 border-l-4 border-blue-500'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <h4
                  className={`font-medium ${event.completed ? 'text-gray-500' : 'text-gray-900'}`}
                >
                  {event.title}
                </h4>
                <span className={`text-sm ${event.completed ? 'text-gray-400' : 'text-blue-600'}`}>
                  {event.time}
                </span>
              </div>
              {event.location && (
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {event.location}
                </div>
              )}
              {event.current && (
                <div className="mt-2 text-xs text-blue-600 font-medium">Evento actual</div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-right">
        <button className="text-sm text-blue-600 hover:text-blue-800">
          Ver cronograma completo →
        </button>
      </div>
    </div>
  );
};
