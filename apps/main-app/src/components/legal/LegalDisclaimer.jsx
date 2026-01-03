import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';

export default function LegalDisclaimer({ countryName, officialUrl }) {
  return (
    <div className="rounded-lg bg-yellow-50 border border-yellow-300 p-3 mb-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
        <div className="flex-1">
          <p className="text-sm text-yellow-800">
            <strong>Información orientativa.</strong> Verifica siempre con las autoridades oficiales de {countryName}.
            {officialUrl && (
              <>
                {' '}
                <a
                  href={officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-yellow-700 hover:text-yellow-900 underline"
                >
                  Fuente oficial
                  <ExternalLink size={12} />
                </a>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
