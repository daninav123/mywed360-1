import React, { useState } from 'react';
import { Flag, Send, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export default function ReportIssueButton({ countryCode, legalType, requirementId }) {
  const [showModal, setShowModal] = useState(false);
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!issueType || !description.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'legalDataIssues'), {
        countryCode,
        legalType,
        requirementId,
        issueType,
        description: description.trim(),
        userAgent: navigator.userAgent,
        reportedAt: serverTimestamp(),
        status: 'pending',
        priority: issueType === 'incorrect_info' ? 'high' : 'medium',
      });

      toast.success('✅ Reporte enviado. Gracias por ayudarnos a mejorar!', {
        autoClose: 3000,
      });
      
      setShowModal(false);
      setIssueType('');
      setDescription('');
    } catch (error) {
      console.error('Error enviando reporte:', error);
      toast.error('Error al enviar el reporte. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-red-700 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 transition-colors"
      >
        <Flag size={16} />
        Reportar información incorrecta
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Flag className="text-red-600" size={20} />
                Reportar problema
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de problema
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="">Selecciona un tipo</option>
                  <option value="incorrect_info">Información incorrecta</option>
                  <option value="outdated">Información desactualizada</option>
                  <option value="missing_info">Falta información importante</option>
                  <option value="wrong_costs">Costos incorrectos</option>
                  <option value="wrong_timeline">Plazos incorrectos</option>
                  <option value="wrong_documents">Documentos incorrectos</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del problema
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe qué información es incorrecta y cuál debería ser la correcta. Si es posible, incluye fuentes oficiales."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 min-h-[100px]"
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  💡 <strong>Ayúdanos a mejorar:</strong> Tu reporte nos ayudará a mantener la
                  información actualizada y precisa. Revisamos todos los reportes y actualizamos
                  los datos cuando es necesario.
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Enviar reporte
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
