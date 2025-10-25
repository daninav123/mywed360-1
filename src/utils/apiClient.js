import i18n from '../i18n';

/**
 * Cliente API centralizado para manejar el nuevo formato de respuestas
 * Según convenciones definidas en docs/API_CONVENTIONS.md
 * 
 * Formato de respuesta esperado:
 * - Éxito: { success: true, data: {...} }
 * - Error: { success: false, error: { code: string, message: string }, requestId?: string }
 */

/**
 * Error personalizado para errores de API
 */
export class ApiError extends Error {
  constructor(message, code, requestId, statusCode) {
    super(message);
    this.name = 'ApiErrori18n.t('common.thiscode_code_thisrequestid_requestid_thisstatuscode_statuscode')Content-Type': 'application/jsoni18n.t('common.optionsheaders_intentar_parsear_json_let_result')parse_errori18n.t('common.null_responsestatus_verificar_respuesta_sigue_formato')booleani18n.t('common.formato_estandar_nuevo_resultsuccess_const_errorcode')unknown_error';
        const errorMessage = result.error?.message || 'An error occurred';
        const requestId = result.requestId || null;
        throw new ApiError(errorMessage, errorCode, requestId, response.status);
      }
      return result.data;
    }

    // Retrocompatibilidad: formato antiguo sin el campo success
    // Si el status es exitoso (2xx), devolver el resultado completo
    if (response.ok) {
      return result;
    }

    // Si hay error en formato antiguo
    const errorCode = result.error || result.code || 'unknown_error';
    const errorMessage = result.message || 'An error occurred';
    throw new ApiError(errorMessage, errorCode, null, response.status);

  } catch (error) {
    // Si ya es un ApiError, relanzarlo
    if (error instanceof ApiError) {
      throw error;
    }

    // Error de red u otro error
    throw new ApiError(
      error.message || 'Network error',
      'network_errori18n.t('common.null_realiza_una_peticion_get_param')GETi18n.t('common.realiza_una_peticion_post_param_string')POSTi18n.t('common.body_jsonstringifydata_realiza_una_peticion_put')PUTi18n.t('common.body_jsonstringifydata_realiza_una_peticion_delete')DELETEi18n.t('common.maneja_errores_api_forma_centralizada_param')[API Error]', message, details);

    if (showNotification) {
      showNotification({
        type: 'error',
        title: 'Errori18n.t('common.message_message_details_errorrequestid_request_errorrequestid')[Unexpected Error]', error);
  if (showNotification) {
    showNotification({
      type: 'error',
      title: 'Error',
      message: error.message || 'An unexpected error occurred',
    });
  }

  return null;
}

export default {
  request: apiRequest,
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  handleError: handleApiError,
  ApiError,
};
