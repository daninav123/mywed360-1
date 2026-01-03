import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { findGuestByName, createGuest, saveRSVPResponse } from '../services/rsvpService';
import { getWebBySlug } from '../services/webBuilder/craftWebService';
import { toast } from 'react-toastify';
/**
 * Página pública de RSVP - Los invitados confirman su asistencia
 */
const PublicRSVP = () => {
  const { slug } = useParams();
  const location = useLocation();
  const [webData, setWebData] = useState(null);
  const [step, setStep] = useState(1); // 1: Buscar nombre, 2: Confirmar datos, 3: Confirmación
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Datos del formulario
  const [nombre, setNombre] = useState('');
  const [guestData, setGuestData] = useState(null);
  const [formData, setFormData] = useState({
    asistira: null,
    numAcompañantes: 0,
    nombresAcompañantes: [],
    menuPreferencias: [],
    restriccionesAlimentarias: '',
    comentarios: '',
    emailConfirmacion: '',
  });

  useEffect(() => {
    // Resetear el estado cuando se monta el componente o cambia el slug
    setStep(1);
    setNombre('');
    setGuestData(null);
    setFormData({
      asistira: null,
      numAcompañantes: 0,
      nombresAcompañantes: [],
      menuPreferencias: [],
      restriccionesAlimentarias: '',
      comentarios: '',
      emailConfirmacion: '',
    });

    loadWeb();
  }, [slug]);

  const loadWeb = async () => {
    try {
      setLoading(true);
      console.log('🔍 Cargando web con slug:', slug);
      const data = await getWebBySlug(slug);

      console.log('📦 Web obtenida:', data);

      if (!data) {
        console.error('❌ No se encontró la web');
        setError('Web no encontrada');
        toast.error('❌ Esta web no existe');
        return;
      }

      if (!data.published) {
        console.error('❌ La web no está publicada');
        setError('Web no publicada');
        toast.error('❌ Esta web no está disponible');
        return;
      }

      setWebData(data);
      setError(null);
      console.log('✅ Web cargada correctamente');
    } catch (error) {
      console.error('Error cargando web:', error);
      setError('Error al cargar');
      toast.error('❌ Error al cargar la web');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchGuest = async (e) => {
    e.preventDefault();

    if (!nombre.trim()) {
      toast.error('Por favor, introduce tu nombre');
      return;
    }

    try {
      setSearching(true);
      console.log('🔍 Buscando invitado:', nombre);
      console.log('📋 weddingId:', webData.weddingId);

      if (!webData.weddingId) {
        toast.error('❌ Esta web no está asociada a una boda');
        return;
      }

      const guest = await findGuestByName(webData.weddingId, nombre);

      if (guest) {
        // Invitado encontrado en la lista
        setGuestData(guest);

        if (guest.respondido) {
          toast.info('Ya has confirmado tu asistencia anteriormente');
          // Cargar respuesta anterior
          setFormData({
            asistira: guest.asistira,
            numAcompañantes: guest.numAcompañantes || 0,
            nombresAcompañantes: guest.nombresAcompañantes || [],
            menuPreferencias: guest.menuPreferencias || [],
            restriccionesAlimentarias: guest.restriccionesAlimentarias || '',
            comentarios: guest.comentarios || '',
          });
        }

        setStep(2);
      } else {
        // Invitado NO encontrado en la lista
        console.log('❌ Invitado no está en la lista de invitados');
        toast.error('❌ No encontramos tu nombre en la lista de invitados');
        setNombre('');
      }
    } catch (error) {
      console.error('Error buscando invitado:', error);
      toast.error('Error al buscar invitado');
    } finally {
      setSearching(false);
    }
  };

  const handleSubmitRSVP = async (e) => {
    e.preventDefault();

    if (formData.asistira === null) {
      toast.error('Por favor, indica si asistirás o no');
      return;
    }

    try {
      setSubmitting(true);

      console.log('📝 Guest Data:', guestData);
      console.log('📝 Guest ID:', guestData?.id);
      console.log('📝 Wedding ID:', webData?.weddingId);
      console.log('📝 RSVP ID existente:', guestData?.rsvpId);

      if (!guestData?.id) {
        throw new Error('No se encontró el ID del invitado');
      }

      if (!webData?.weddingId) {
        throw new Error('No se encontró el ID de la boda');
      }

      await saveRSVPResponse(webData.weddingId, guestData.id, formData, guestData.rsvpId || null);

      setStep(3);
      toast.success('✅ ¡Confirmación guardada!');
    } catch (error) {
      console.error('Error guardando RSVP:', error);
      toast.error('Error al guardar tu confirmación');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcompañantesChange = (index, value) => {
    const nuevosNombres = [...formData.nombresAcompañantes];
    nuevosNombres[index] = value;
    setFormData({ ...formData, nombresAcompañantes: nuevosNombres });
  };

  const addAcompañante = () => {
    if (formData.nombresAcompañantes.length < formData.numAcompañantes) {
      setFormData({
        ...formData,
        nombresAcompañantes: [...formData.nombresAcompañantes, ''],
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className=" text-lg" className="text-secondary">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!webData) {
    return (
      <div className="min-h-screen bg-[var(--color-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-3xl font-bold  mb-2" className="text-body">Web no encontrada</h1>
          <p className="" className="text-secondary">La web que buscas no está disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto p-6">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2">📨 Confirma tu Asistencia</h1>
        <p className="text-muted">{webData.nombre || 'Nuestra Boda'}</p>
      </div>

      {/* PASO 1: Buscar por nombre */}
        {step === 1 && (
          <div className=" rounded-xl shadow-md p-8" className="bg-surface">
            <h2 className="text-2xl font-bold  mb-4" className="text-body">¿Cuál es tu nombre?</h2>
            <p className=" mb-6" className="text-secondary">
              Introduce tu nombre completo tal como aparece en la invitación
            </p>

            <form onSubmit={handleSearchGuest}>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder={t('rsvp.namePlaceholder')}
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg text-lg mb-4 focus:border-purple-500 focus:outline-none"
                disabled={searching}
              />

              <button
                type="submit"
                disabled={searching}
                className="w-full px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg font-semibold hover:shadow-md transition-all disabled:opacity-50"
              >
                {searching ? 'Buscando...' : 'Continuar'}
              </button>
            </form>

            <p className="text-sm  mt-4 text-center" className="text-muted">
              💡 Escribe tu nombre tal como aparece en la invitación
            </p>
          </div>
        )}

        {/* PASO 2: Formulario de confirmación */}
        {step === 2 && guestData && (
          <div className=" rounded-xl shadow-md p-8" className="bg-surface">
            <div className="mb-6">
              <h2 className="text-2xl font-bold " className="text-body">¡Hola, {guestData.nombre}!</h2>
              <p className="" className="text-secondary">Por favor, confirma tu asistencia</p>
            </div>

            <form onSubmit={handleSubmitRSVP} className="space-y-6">
              {/* Email de confirmación */}
              <div>
                <label className="block  font-semibold mb-3" className="text-body">Tu email *</label>
                <input
                  type="email"
                  value={formData.emailConfirmacion}
                  onChange={(e) => setFormData({ ...formData, emailConfirmacion: e.target.value })}
                  placeholder={t('rsvp.emailPlaceholder')}
                  required
                  className="w-full px-4 py-3 border-2  rounded-lg focus:border-purple-500 focus:outline-none" className="border-default"
                />
                <p className="text-xs  mt-2" className="text-secondary">
                  📧 Tu email quedará registrado con la confirmación
                </p>
              </div>

              {/* Asistencia */}
              <div>
                <label className="block  font-semibold mb-3" className="text-body">
                  ¿Asistirás al evento? *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, asistira: true })}
                    className={`px-6 py-4 rounded-lg font-semibold transition-all ${
                      formData.asistira === true
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✅ Sí, asistiré
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, asistira: false, numAcompañantes: 0 })
                    }
                    className={`px-6 py-4 rounded-lg font-semibold transition-all ${
                      formData.asistira === false
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ❌ No podré asistir
                  </button>
                </div>
              </div>

              {/* Acompañantes (solo si asiste) */}
              {formData.asistira && (
                <>
                  <div>
                    <label className="block  font-semibold mb-3" className="text-body">
                      ¿Cuántos acompañantes traerás?
                    </label>
                    <select
                      value={formData.numAcompañantes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          numAcompañantes: parseInt(e.target.value),
                          nombresAcompañantes: [],
                        })
                      }
                      className="w-full px-4 py-3 border-2  rounded-lg focus:border-purple-500 focus:outline-none" className="border-default"
                    >
                      <option value="0">Solo yo</option>
                      <option value="1">1 acompañante</option>
                      <option value="2">2 acompañantes</option>
                      <option value="3">3 acompañantes</option>
                      <option value="4">4 acompañantes</option>
                    </select>
                  </div>

                  {/* Nombres de acompañantes */}
                  {formData.numAcompañantes > 0 && (
                    <div>
                      <label className="block  font-semibold mb-3" className="text-body">
                        Nombres de tus acompañantes
                      </label>
                      {[...Array(formData.numAcompañantes)].map((_, index) => (
                        <input
                          key={index}
                          type="text"
                          value={formData.nombresAcompañantes[index] || ''}
                          onChange={(e) => handleAcompañantesChange(index, e.target.value)}
                          placeholder={t('rsvp.companionPlaceholder', { number: index + 1 })}
                          className="w-full px-4 py-3 border-2  rounded-lg mb-2 focus:border-purple-500 focus:outline-none" className="border-default"
                        />
                      ))}
                    </div>
                  )}

                  {/* Restricciones alimentarias */}
                  <div>
                    <label className="block  font-semibold mb-3" className="text-body">
                      Restricciones alimentarias o alergias
                    </label>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <label className="flex items-center space-x-2 cursor-pointer bg-purple-50 p-3 rounded-lg hover:bg-purple-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={
                            formData.restriccionesAlimentarias?.includes('vegetariano') || false
                          }
                          onChange={(e) => {
                            const restrictions = formData.restriccionesAlimentarias || '';
                            const newRestrictions = e.target.checked
                              ? restrictions + (restrictions ? ', ' : '') + 'vegetariano'
                              : restrictions
                                  .replace(/,?\s*vegetariano/g, '')
                                  .replace(/^,\s*/, '')
                                  .trim();
                            setFormData({
                              ...formData,
                              restriccionesAlimentarias: newRestrictions,
                            });
                          }}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm font-medium">Vegetariano</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer bg-purple-50 p-3 rounded-lg hover:bg-purple-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.restriccionesAlimentarias?.includes('vegano') || false}
                          onChange={(e) => {
                            const restrictions = formData.restriccionesAlimentarias || '';
                            const newRestrictions = e.target.checked
                              ? restrictions + (restrictions ? ', ' : '') + 'vegano'
                              : restrictions
                                  .replace(/,?\s*vegano/g, '')
                                  .replace(/^,\s*/, '')
                                  .trim();
                            setFormData({
                              ...formData,
                              restriccionesAlimentarias: newRestrictions,
                            });
                          }}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm font-medium">Vegano</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer bg-purple-50 p-3 rounded-lg hover:bg-purple-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={
                            formData.restriccionesAlimentarias?.includes('celíaco') ||
                            formData.restriccionesAlimentarias?.includes('celiaco') ||
                            false
                          }
                          onChange={(e) => {
                            const restrictions = formData.restriccionesAlimentarias || '';
                            const newRestrictions = e.target.checked
                              ? restrictions + (restrictions ? ', ' : '') + 'celíaco'
                              : restrictions
                                  .replace(/,?\s*celí?aco/g, '')
                                  .replace(/^,\s*/, '')
                                  .trim();
                            setFormData({
                              ...formData,
                              restriccionesAlimentarias: newRestrictions,
                            });
                          }}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm font-medium">Celíaco</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer bg-purple-50 p-3 rounded-lg hover:bg-purple-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={
                            formData.restriccionesAlimentarias?.includes('sin lactosa') || false
                          }
                          onChange={(e) => {
                            const restrictions = formData.restriccionesAlimentarias || '';
                            const newRestrictions = e.target.checked
                              ? restrictions + (restrictions ? ', ' : '') + 'sin lactosa'
                              : restrictions
                                  .replace(/,?\s*sin lactosa/g, '')
                                  .replace(/^,\s*/, '')
                                  .trim();
                            setFormData({
                              ...formData,
                              restriccionesAlimentarias: newRestrictions,
                            });
                          }}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm font-medium">Sin lactosa</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer bg-purple-50 p-3 rounded-lg hover:bg-purple-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={
                            formData.restriccionesAlimentarias?.includes('sin gluten') || false
                          }
                          onChange={(e) => {
                            const restrictions = formData.restriccionesAlimentarias || '';
                            const newRestrictions = e.target.checked
                              ? restrictions + (restrictions ? ', ' : '') + 'sin gluten'
                              : restrictions
                                  .replace(/,?\s*sin gluten/g, '')
                                  .replace(/^,\s*/, '')
                                  .trim();
                            setFormData({
                              ...formData,
                              restriccionesAlimentarias: newRestrictions,
                            });
                          }}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm font-medium">Sin gluten</span>
                      </label>
                    </div>

                    <input
                      type="text"
                      value={formData.restriccionesAlimentarias || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, restriccionesAlimentarias: e.target.value })
                      }
                      placeholder={t('rsvp.allergiesPlaceholder')}
                      className="w-full px-4 py-3 border-2  rounded-lg focus:border-purple-500 focus:outline-none" className="border-default"
                    />
                    <p className="text-xs  mt-2" className="text-secondary">
                      💡 Marca las opciones que apliquen y especifica otras alergias en el campo de
                      texto
                    </p>
                  </div>
                </>
              )}

              {/* Comentarios */}
              <div>
                <label className="block  font-semibold mb-3" className="text-body">
                  Comentarios adicionales
                </label>
                <textarea
                  value={formData.comentarios}
                  onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
                  placeholder={t('rsvp.commentsPlaceholder')}
                  rows="3"
                  className="w-full px-4 py-3 border-2  rounded-lg focus:border-purple-500 focus:outline-none" className="border-default"
                ></textarea>
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-gray-200  rounded-lg font-semibold hover:bg-gray-300 transition-all" className="text-body"
                >
                  ← Volver
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg font-semibold hover:shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : '✅ Confirmar Asistencia'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PASO 3: Confirmación */}
        {step === 3 && (
          <div className=" rounded-xl shadow-md p-8 text-center" className="bg-surface">
            <div className="text-6xl mb-4">{formData.asistira ? '🎉' : '😔'}</div>
            <h2 className="text-3xl font-bold  mb-4" className="text-body">
              {formData.asistira ? '¡Confirmación Recibida!' : 'Gracias por Informarnos'}
            </h2>
            <p className="text-lg  mb-6" className="text-secondary">
              {formData.asistira
                ? `¡Nos vemos en la boda${formData.numAcompañantes > 0 ? ` con tus ${formData.numAcompañantes} acompañante${formData.numAcompañantes > 1 ? 's' : ''}` : ''}!`
                : 'Lamentamos que no puedas asistir'}
            </p>

            <div className="bg-purple-50 rounded-lg p-4 mb-6 space-y-2">
              <p className="text-sm " className="text-body">
                ✅ Hemos guardado tu respuesta. Los novios la verán en su panel de gestión.
              </p>
              {formData.emailConfirmacion && (
                <p className="text-xs " className="text-secondary">
                  📧 Email registrado: {formData.emailConfirmacion}
                </p>
              )}
            </div>

            <a
              href={`/web/${slug}`}
              className="inline-block px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg font-semibold hover:shadow-md transition-all"
            >
              Volver a la Web
            </a>
          </div>
        )}
      </div>
    );
};

export default PublicRSVP;
