// Listeners globales para mostrar toasts cuando haya una actualización PWA
// Requiere que <ToastContainer /> esté montado en la app
import React from 'react';
import { toast } from 'react-toastify';
import { useTranslations } from '../../hooks/useTranslations';

let refreshToastId = null;

function showUpdateToast(updateFn) {
  const { t } = useTranslations();

  // Evitar toasts duplicados
  if (refreshToastId) return;
  refreshToastId = toast.info(
    <div>
      Nueva versión disponible
      <button
        style={{ marginLeft: 12, padding: '4px 8px', border: '1px solid #2563eb', borderRadius: 6 }}
        onClick={() => {
          try {
            updateFn?.();
          } catch {}
          toast.dismiss(refreshToastId);
          refreshToastId = null;
        }}
      >
        Actualizar ahora
      </button>
    </div>,
    { autoClose: false }
  );
}

function showOfflineReady() {
  toast.success(t('common.app_esta_lista_para_funcionar'));
}

if (typeof window !== 'undefined') {
  window.addEventListener('pwa:need-refresh', (ev) => {
    const update = ev?.detail?.update;
    showUpdateToast(update);
  });
  window.addEventListener('pwa:offline-ready', () => {
    showOfflineReady();
  });
}
