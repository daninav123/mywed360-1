const DEFAULT_AUTH_ERROR_MESSAGE =
  'No pudimos validar tus credenciales en este momento. Intentalo de nuevo.';

const AUTH_ERROR_MESSAGES = {
  'auth/email-already-in-use': 'Ya existe una cuenta activa con este correo electronico.',
  'auth/invalid-email': 'El correo electronico no tiene un formato valido.',
  'auth/popup-closed-by-user':
    'La ventana de autenticacion se cerro antes de completar el proceso.',
  'auth/cancelled-popup-request':
    'Ya hay una ventana de inicio abierta. Cierra las ventanas e intentalo nuevamente.',
  'auth/popup-blocked':
    'Tu navegador bloqueo la ventana emergente. Permitela y vuelve a intentarlo.',
  'auth/wrong-password': 'La contrasena proporcionada es incorrecta.',
  'auth/user-not-found': 'No encontramos ninguna cuenta con estas credenciales.',
  'auth/too-many-requests':
    'Detectamos demasiados intentos fallidos. Vuelve a intentarlo mas tarde.',
  'auth/network-request-failed':
    'No pudimos conectar con el servicio de autenticacion. Revisa tu conexion a internet.',
  'auth/internal-error':
    'Ocurrio un error inesperado al validar las credenciales. Intentalo de nuevo en un momento.',
  'auth/requires-recent-login':
    'Necesitas iniciar sesion nuevamente para completar esta accion.',
  'auth/unverified-email':
    'Debes verificar tu correo electronico antes de continuar con este flujo.',
  'auth/unavailable': 'El servicio de autenticacion no esta disponible temporalmente.',
};

const SIGN_IN_METHOD_LABELS = {
  password: 'email y contrasena',
  'google.com': 'Google',
  'facebook.com': 'Facebook',
  'apple.com': 'Apple',
  'microsoft.com': 'Microsoft',
  'linkedin.com': 'LinkedIn',
};

const getProviderLabel = (method) =>
  SIGN_IN_METHOD_LABELS[method] || method || 'metodo desconocido';

/**
 * Mapea errores de Firebase Auth a mensajes coherentes para la UI.
 *
 * @param {Object} error - Error recibido desde Firebase Auth.
 * @param {Object} [options]
 * @param {Function} [options.lookupSignInMethods] - Funcion async que devuelve metodos de inicio asociados a un email.
 * @param {string} [options.email] - Email objetivo usado cuando el error no lo expone en customData.
 * @returns {Promise<{ code: string, message: string, original?: Object }>}
 */
export async function mapAuthError(error, options = {}) {
  if (!error) {
    return {
      code: 'auth/unknown',
      message: DEFAULT_AUTH_ERROR_MESSAGE,
    };
  }

  const code = typeof error.code === 'string' ? error.code : 'auth/unknown';
  const baseMessage =
    AUTH_ERROR_MESSAGES[code] || error.message || DEFAULT_AUTH_ERROR_MESSAGE;

  if (code === 'auth/account-exists-with-different-credential') {
    const email =
      options.email ||
      error.customData?.email ||
      error.email ||
      error.customData?.operationType;

    if (email && typeof options.lookupSignInMethods === 'function') {
      try {
        const methods = await options.lookupSignInMethods(email);
        if (methods && methods.length > 0) {
          const providersReadable = methods.map(getProviderLabel).join(', ');
          return {
            code,
            message: `Ya existe una cuenta con este correo asociada a ${providersReadable}. Inicia sesion con ese metodo y vincula nuevas credenciales desde tu perfil.`,
            original: error,
          };
        }
      } catch (lookupError) {
        // console.warn('[authErrorMapper] No se pudieron obtener los metodos asociados:', lookupError);
      }
    }

    return {
      code,
      message:
        'Ya existe una cuenta activa con este correo. Inicia sesion con ese metodo y vincula nuevas credenciales desde tu perfil.',
      original: error,
    };
  }

  return {
    code,
    message: baseMessage,
    original: error,
  };
}

export { AUTH_ERROR_MESSAGES, DEFAULT_AUTH_ERROR_MESSAGE };
