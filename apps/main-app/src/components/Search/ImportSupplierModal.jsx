import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  Globe, 
  Star,
  Check,
  AlertCircle,
  Loader
} from 'lucide-react';
import { getPlaceDetails } from '../../services/webSearchService';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

/**
 * Modal para importar un proveedor externo a la base de datos local
 */
const ImportSupplierModal = ({ supplier, weddingId, isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState(null);
  const [fullDetails, setFullDetails] = useState(null);
  const [notes, setNotes] = useState('');

  // Cargar detalles completos cuando se abre el modal
  React.useEffect(() => {
    if (isOpen && supplier && supplier.source === 'google_places' && !fullDetails) {
      loadFullDetails();
    }
  }, [isOpen, supplier]);

  const loadFullDetails = async () => {
    setLoadingDetails(true);
    try {
      const details = await getPlaceDetails(supplier.id);
      if (details) {
        setFullDetails(details);
      }
    } catch (err) {
      // console.error('Error loading details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleImport = async () => {
    if (!weddingId || !supplier) return;

    setLoading(true);
    setError(null);

    try {
      // Preparar datos del proveedor
      const supplierData = {
        name: supplier.name,
        companyName: supplier.name,
        category: supplier.category || 'Otro',
        service: supplier.category || 'Proveedor',
        
        // Contacto
        email: null,
        phone: fullDetails?.phone || supplier.phone || null,
        website: fullDetails?.website || supplier.website || null,
        
        // Ubicación
        address: fullDetails?.address || supplier.address || null,
        location: supplier.location || null,
        
        // Rating y reviews
        rating: supplier.rating || 0,
        reviewCount: supplier.reviewCount || 0,
        externalReviews: fullDetails?.reviews || [],
        
        // Fotos
        photos: fullDetails?.photos || (supplier.photo ? [supplier.photo] : []),
        portfolio: fullDetails?.photos || [],
        
        // Precio
        priceLevel: supplier.priceLevel || null,
        estimatedPrice: null,
        
        // Metadata
        source: supplier.source || 'web_import',
        externalId: supplier.id,
        importedAt: new Date().toISOString(),
        notes: notes || null,
        
        // Estado
        status: 'lead', // lead, contacted, hired, rejected
        contacted: false,
        hired: false,
        
        // Horarios
        hours: fullDetails?.hours || null,
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Guardar en Firestore
      const suppliersRef = collection(db, 'weddings', weddingId, 'suppliers');
      const docRef = await addDoc(suppliersRef, supplierData);

      // console.log('✅ Proveedor importado:', docRef.id);

      // Callback de éxito
      if (onSuccess) {
        onSuccess({ id: docRef.id, ...supplierData });
      }

      onClose();
    } catch (err) {
      // console.error('Error importing supplier:', err);
      setError('Error al importar el proveedor. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !supplier) return null;

  const details = fullDetails || supplier;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50 max-h-[90vh] overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl m-4">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Importar Proveedor
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Añadir {supplier.name} a tu lista de proveedores
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Loading details */}
            {loadingDetails && (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            )}

            {/* Fotos */}
            {details.photos && details.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {details.photos.slice(0, 6).map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`${supplier.name} ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            {/* Info básica */}
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {supplier.name}
                </h3>
                <p className="text-gray-600">{supplier.category}</p>
              </div>

              {/* Rating */}
              {supplier.rating > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold text-lg">
                      {supplier.rating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-gray-500">
                    ({supplier.reviewCount} reseñas)
                  </span>
                </div>
              )}

              {/* Contacto */}
              <div className="space-y-2">
                {details.address && (
                  <div className="flex items-start gap-2 text-gray-700">
                    <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{details.address}</span>
                  </div>
                )}
                {details.phone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-5 w-5" />
                    <a href={`tel:${details.phone}`} className="text-sm hover:text-purple-600">
                      {details.phone}
                    </a>
                  </div>
                )}
                {details.website && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Globe className="h-5 w-5" />
                    <a 
                      href={details.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm hover:text-purple-600 truncate"
                    >
                      {details.website}
                    </a>
                  </div>
                )}
              </div>

              {/* Reviews destacadas */}
              {details.reviews && details.reviews.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Reseñas destacadas</h4>
                  <div className="space-y-3">
                    {details.reviews.slice(0, 2).map((review, index) => (
                      <div key={index} className="text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{review.author}</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs">{review.rating}</span>
                          </div>
                        </div>
                        <p className="text-gray-600 line-clamp-2">{review.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Añade notas sobre este proveedor..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-4 bg-red-50 rounded-lg text-red-800">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Importar Proveedor
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ImportSupplierModal;
