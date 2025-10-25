// Servicio de sincronización para manejar la persistencia híbrida entre localStorage y Firestore
import i18n from '../i18n';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

import { db } from '../firebaseConfig';

// Estado global de la sincronización
const syncState = {
  isOnline: navigator.onLine,
  isSyncing: false,
  pendingChanges: false,
  lastSyncTime: null,
};

// Evento para actualizar componentes cuando cambia el estado de sincronización
const syncEventTarget = new EventTarget();
const SYNC_STATE_CHANGE = 'syncStateChangei18n.t('common.guarda_datos_tanto_localstorage_como_firestore')usersi18n.t('common.coleccion_firestore_doc_usersuid_mergewithexisting_true')/i18n.t('common.filterboolean_partslength_ruta_documento_valida_docref')[SyncService] docPath inválido, usando fallback:', options.docPath, e);
          }
        }
        if (!docRef) {
          if (options.collection === 'userProfile') {
            const wid = localStorage.getItem('maloveapp_active_wedding');
            if (wid) {
              // Guardar como campo dentro del documento principal de la boda
              docRef = doc(db, 'weddings', wid);
            } else {
              docRef = doc(db, 'usersi18n.t('common.useruid_else_docref_docdb_optionscollection_useruid')Datos guardados en la nube', 'success');
          }
        } catch (error) {
          console.error('Error al guardar en Firestore:', error);
          syncState.pendingChanges = true;

          if (options.showNotification) {
            showNotification(
              'Los datos se guardaron localmente, pero no se pudieron sincronizar con la nube',
              'warningi18n.t('common.anadir_cola_sincronizacion_pendiente_addtopendingsyncqueuekey_data')Datos guardados localmente', 'info');
        }
        syncState.pendingChanges = true;
      }

      syncState.isSyncing = false;
      notifySyncStateChange();
    }

    return true;
  } catch (error) {
    console.error('Error al guardar datos:', error);

    if (options.showNotification) {
      showNotification('Error al guardar datos', 'errori18n.t('common.syncstateissyncing_false_notifysyncstatechange_return_false_carga')usersi18n.t('common.coleccion_firestore_doc_usersuid_fallbacktolocal_true')/').filter(Boolean);
              if (parts.length % 2 === 0) {
                docRef = doc(db, ...parts);
              } else if (parts.length > 2) {
                const parentParts = parts.slice(0, -1);
                if (parentParts.length % 2 === 0) {
                  docRef = doc(db, ...parentParts);
                }
              }
            } catch (e) {
              console.warn('[SyncService] docPath inválido, usando fallback:', options.docPath, e);
            }
          }
          if (!docRef) {
            if (options.collection === 'userProfile') {
              const wid = localStorage.getItem('maloveapp_active_wedding');
              if (wid) {
                docRef = doc(db, 'weddings', wid);
              } else {
                docRef = doc(db, 'usersi18n.t('common.useruid_else_docref_docdb_optionscollection_useruid')Error al cargar de Firestore, intentando localStorage:', error);
        }
      }
    }

    // 2. Intentar cargar de localStorage como respaldo
    if (options.fallbackToLocal) {
      const localData = localStorage.getItem(key);
      if (localData) {
        try {
          const parsedData = JSON.parse(localData);

          syncState.isSyncing = false;
          notifySyncStateChange();

          return parsedData;
        } catch (e) {
          console.error('Error al analizar datos de localStorage:', e);
        }
      }
    }

    syncState.isSyncing = false;
    notifySyncStateChange();
    return null;
  } catch (error) {
    console.error('Error al cargar datos:', error);
    syncState.isSyncing = false;
    notifySyncStateChange();
    return null;
  }
};

// Sincroniza todos los datos pendientes cuando hay conexión
export const syncPendingData = async () => {
  if (!navigator.onLine) return false;

  const pendingSyncQueue = JSON.parse(localStorage.getItem('pendingSyncQueue') || '[]i18n.t('common.pendingsyncqueuelength_return_true_syncstateissyncing_true_notifysyncstatechange')Error al sincronizar item pendiente:', error);
      success = false;
    }
  }

  if (success) {
    localStorage.removeItem('pendingSyncQueue');
    syncState.pendingChanges = false;
    showNotification(i18n.t('common.todos_los_cambios_han_sincronizado_con'), 'successi18n.t('common.syncstateissyncing_false_syncstatelastsynctime_new_datetoisostring_notifysyncstatechange')pendingSyncQueue') || '[]');

  // Evitar duplicados (reemplazar si existe)
  const index = pendingSyncQueue.findIndex((item) => item.key === key);

  if (index >= 0) {
    pendingSyncQueue[index] = { key, data, options };
  } else {
    pendingSyncQueue.push({ key, data, options });
  }

  localStorage.setItem('pendingSyncQueuei18n.t('common.jsonstringifypendingsyncqueue_funcion_simple_para_mostrar_notificaciones')info') => {
  if (typeof window.toast === 'functioni18n.t('common.windowtoasttypemessage_else_consolelogtypetouppercase_message_registra_los')onlinei18n.t('common.syncstateisonline_true_notifysyncstatechange_syncpendingdata_intentar_sincronizar')offline', () => {
    syncState.isOnline = false;
    notifySyncStateChange();
  });
};

// Suscribe un componente a cambios en el estado de sincronización
export const subscribeSyncState = (callback) => {
  const handler = () => callback(getSyncState());
  syncEventTarget.addEventListener(SYNC_STATE_CHANGE, handler);
  return () => syncEventTarget.removeEventListener(SYNC_STATE_CHANGE, handler);
};

// Notifica a los suscriptores sobre cambios en el estado
const notifySyncStateChange = () => {
  syncEventTarget.dispatchEvent(new CustomEvent(SYNC_STATE_CHANGE));
};

// Obtiene el estado actual de sincronización
export const getSyncState = () => ({ ...syncState });

// Inicializa el servicio
setupSyncListeners();
