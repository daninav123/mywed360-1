import i18n from '../i18n';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, enableNetwork, disableNetwork } from 'firebase/firestore';

import { db } from '../firebaseConfig';

/**
 * Realiza diagnóstico de la conexión a Firestore
 * @returns {Promise<Object>} Resultado del diagnóstico
 */
export const diagnosticarFirestore = async () => {
  const resultado = {
    timestamp: new Date().toISOString(),
    estadoConexion: 'desconocidoi18n.t('common.usuarioautenticado_false_permisoescritura_false_permisolectura_false')No hay usuario autenticado, requerido para operaciones en Firestorei18n.t('common.return_resultado_intentar_forzar_reconexion_red')Desactivar/activar red para forzar reconexióni18n.t('common.await_disablenetworkdb_await_new_promiseresolve_settimeoutresolve')system_status', 'online_check');
      await getDoc(docRef);
      resultado.permisoLectura = true;
      resultado.estadoConexion = 'onlinei18n.t('common.catch_error_resultadoerrorespusherror_leer_documento_publico')usersi18n.t('common.usuariouid_await_setdoc_userdocref_diagnosticcheck_new')test-indexeddb');

        testRequest.onerror = function () {
          resultado.errores.push(i18n.t('common.indexeddb_esta_bloqueado_disponible'));
        };

        testRequest.onsuccess = function () {
          resultado.solucionesIntentadas.push('Acceso a IndexedDB verificado correctamente');
          testRequest.result.close();
        };
      } else {
        resultado.errores.push(i18n.t('common.indexeddb_esta_disponible_este_navegador'));
      }
    } catch (error) {
      resultado.errores.push(`Error al verificar IndexedDB: ${error.message}`);
    }
  } catch (error) {
    resultado.errores.push(`Error general: ${error.message}`);
  }

  return resultado;
};

/**
 * Intenta resolver problemas comunes de conexión a Firestore
 * @returns {Promise<Object>} Resultado del intento de reparación
 */
export const repararConexionFirestore = async () => {
  const resultado = {
    accionesRealizadas: [],
    errores: [],
    exito: false,
  };

  try {
    // 1. Forzar reconexión a la red
    try {
      resultado.accionesRealizadas.push('Desactivar red temporalmente');
      await disableNetwork(db);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      resultado.accionesRealizadas.push('Reactivar redi18n.t('common.await_enablenetworkdb_await_new_promiseresolve_settimeoutresolve')online') {
      resultado.exito = true;
      resultado.accionesRealizadas.push(i18n.t('common.conexion_restablecida_correctamente'));
    } else {
      resultado.exito = false;
      resultado.errores.push(i18n.t('common.pudo_restablecer_conexion'));
    }
  } catch (error) {
    resultado.errores.push(`Error durante la reparación: ${error.message}`);
    resultado.exito = false;
  }

  return resultado;
};
