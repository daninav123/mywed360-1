import React, { useState, useMemo } from 'react';
import {
  X,
  Heart,
  Star,
  MapPin,
  CheckCircle,
  Search,
  Trash2,
  FileText,
  Image,
  ChevronDown,
  Edit3,
  Check,
  GitCompare,
  Tag,
  Plus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { toast } from 'react-toastify';
import useTranslations from '../../hooks/useTranslations';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useSupplierContacts } from '../../contexts/SupplierContactsContext';
import useActiveWeddingInfo from '../../hooks/useActiveWeddingInfo';
import RequestQuoteModal from './RequestQuoteModal';
import ImageGalleryModal from './ImageGalleryModal';

export default function SelectFromFavoritesModal({
  open,
  onClose,
  serviceName,
  favorites,
  onAssign,
}) {
  const [loading, setLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteSupplier, setQuoteSupplier] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [sortBy, setSortBy] = useState('recent'); // recent, rating, price, distance
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editedNote, setEditedNote] = useState('');
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [supplierTags, setSupplierTags] = useState({});
  const [editingTagsId, setEditingTagsId] = useState(null);
  const [newTag, setNewTag] = useState('');
  const navigate = useNavigate();

  // Tags predefinidos
  const PRESET_TAGS = [
    { id: 'economico', label: 'Económico', color: 'green' },
    { id: 'mejor-portfolio', label: 'Mejor portfolio', color: 'purple' },
    { id: 'rapido', label: 'Respondió rápido', color: 'blue' },
    { id: 'recomendado', label: 'Recomendado', color: 'yellow' },
    { id: 'alta-calidad', label: 'Alta calidad', color: 'pink' },
    { id: 'flexible', label: 'Flexible', color: 'indigo' },
  ];
  const { t, format } = useTranslations();
  const { removeFavorite, updateFavoriteNotes } = useFavorites();
  const { getLastContact, needsFollowUp } = useSupplierContacts();
  const { info: weddingProfile } = useActiveWeddingInfo();

  // Filtrar y ordenar favoritos - DEBE estar ANTES del early return
  const filteredAndSortedFavorites = useMemo(() => {
    // Primero filtrar por búsqueda
    let filtered = favorites;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = favorites.filter((fav) => {
        const supplier = fav.supplier;
        return (
          supplier.name?.toLowerCase().includes(query) ||
          supplier.location?.city?.toLowerCase().includes(query) ||
          supplier.location?.province?.toLowerCase().includes(query) ||
          supplier.priceRange?.toLowerCase().includes(query) ||
          fav.notes?.toLowerCase().includes(query)
        );
      });
    }

    // Luego ordenar
    const sorted = [...filtered];
    switch (sortBy) {
      case 'rating':
        return sorted.sort((a, b) => (b.supplier?.rating || 0) - (a.supplier?.rating || 0));
      case 'price':
        return sorted.sort((a, b) => {
          const priceA = a.supplier?.priceRange?.match(/\d+/)?.[0] || Infinity;
          const priceB = b.supplier?.priceRange?.match(/\d+/)?.[0] || Infinity;
          return Number(priceA) - Number(priceB);
        });
      case 'distance':
        return sorted.sort((a, b) => {
          const cityA = a.supplier?.location?.city || '';
          const cityB = b.supplier?.location?.city || '';
          return cityA.localeCompare(cityB);
        });
      case 'recent':
      default:
        return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
  }, [favorites, sortBy, searchQuery]);

  if (!open) return null;

  const handleAssign = async (supplier) => {
    setLoading(true);
    setSelectedSupplier(supplier.id);

    try {
      await onAssign(supplier);
      toast.success(
        t('suppliers.selectFavorites.toast.assigned', {
          name: supplier.name || t('suppliers.card.hybrid.defaults.name', 'Proveedor'),
        })
      );
      onClose();
    } catch (error) {
      toast.error(
        error?.message || t('suppliers.selectFavorites.toast.error', 'Error al asignar proveedor')
      );
      // console.error(error);
    } finally {
      setLoading(false);
      setSelectedSupplier(null);
    }
  };

  const handleDelete = async (supplierId, supplierName) => {
    if (
      !confirm(
        t('suppliers.selectFavorites.delete.confirm', {
          name: supplierName,
          defaultValue: '¿Eliminar {{name}} de favoritos?',
        })
      )
    ) {
      return;
    }

    setDeletingId(supplierId);
    try {
      await removeFavorite(supplierId);
      toast.success(
        t('suppliers.selectFavorites.delete.success', { defaultValue: 'Eliminado de favoritos' })
      );
    } catch (error) {
      toast.error(
        t('suppliers.selectFavorites.delete.error', { defaultValue: 'Error al eliminar' })
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleRequestQuote = (supplier) => {
    setQuoteSupplier(supplier);
    setShowQuoteModal(true);
  };

  const handleViewGallery = (portfolio) => {
    setGalleryImages(portfolio || []);
    setShowGallery(true);
  };

  const handleStartEditNote = (favoriteId, currentNote) => {
    setEditingNoteId(favoriteId);
    setEditedNote(currentNote || '');
  };

  const handleSaveNote = async (supplierId) => {
    try {
      await updateFavoriteNotes(supplierId, editedNote);
      toast.success(
        t('suppliers.selectFavorites.notes.updated', { defaultValue: 'Nota actualizada' })
      );
      setEditingNoteId(null);
      setEditedNote('');
    } catch (error) {
      toast.error(
        t('suppliers.selectFavorites.notes.error', { defaultValue: 'Error al actualizar nota' })
      );
    }
  };

  const handleToggleCompare = (supplierId) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(supplierId)) {
        return prev.filter((id) => id !== supplierId);
      } else {
        // Máximo 3 proveedores para comparar
        if (prev.length >= 3) {
          toast.warning(
            t('suppliers.selectFavorites.compare.maxReached', {
              defaultValue: 'Máximo 3 proveedores para comparar',
            })
          );
          return prev;
        }
        return [...prev, supplierId];
      }
    });
  };

  const handleCompare = () => {
    if (selectedForCompare.length < 2) {
      toast.warning(
        t('suppliers.selectFavorites.compare.minRequired', {
          defaultValue: 'Selecciona al menos 2 proveedores',
        })
      );
      return;
    }
    setShowComparison(true);
  };

  const handleAddTag = (supplierId, tagId) => {
    setSupplierTags((prev) => {
      const currentTags = prev[supplierId] || [];
      if (currentTags.includes(tagId)) {
        return { ...prev, [supplierId]: currentTags.filter((t) => t !== tagId) };
      }
      return { ...prev, [supplierId]: [...currentTags, tagId] };
    });
  };

  const handleAddCustomTag = (supplierId, tag) => {
    if (!tag.trim()) return;
    setSupplierTags((prev) => {
      const currentTags = prev[supplierId] || [];
      const customTag = `custom_${tag.trim()}`;
      if (currentTags.includes(customTag)) return prev;
      return { ...prev, [supplierId]: [...currentTags, customTag] };
    });
    setNewTag('');
    setEditingTagsId(null);
  };

  const handleRemoveTag = (supplierId, tagId) => {
    setSupplierTags((prev) => ({
      ...prev,
      [supplierId]: (prev[supplierId] || []).filter((t) => t !== tagId),
    }));
  };

  const getTagColor = (tagId) => {
    if (tagId.startsWith('custom_')) return 'gray';
    const preset = PRESET_TAGS.find((t) => t.id === tagId);
    return preset?.color || 'gray';
  };

  const getTagLabel = (tagId) => {
    if (tagId.startsWith('custom_')) return tagId.replace('custom_', '');
    const preset = PRESET_TAGS.find((t) => t.id === tagId);
    return preset?.label || tagId;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-500" fill="currentColor" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{serviceName}</h2>
              <p className="text-sm text-gray-600">
                {t('suppliers.selectFavorites.subtitle', 'Elige uno de tus favoritos')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Ordenar */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-3 pr-8 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
              >
                <option value="recent">📅 Recientes</option>
                <option value="rating">⭐ Mejor valorados</option>
                <option value="price">💰 Menor precio</option>
                <option value="distance">📍 Ubicación</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            {/* Botón Comparar */}
            {selectedForCompare.length > 0 && (
              <button
                onClick={handleCompare}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <GitCompare className="h-4 w-4" />
                Comparar ({selectedForCompare.length})
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Barra de búsqueda (solo si hay >3 favoritos) */}
        {favorites.length > 3 && (
          <div className="px-6 pt-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, ubicación, precio..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-xs text-gray-500 mt-2">
                {filteredAndSortedFavorites.length} resultado(s) de {favorites.length}
              </p>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredAndSortedFavorites.length === 0 && searchQuery ? (
            // No results
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No se encontraron resultados
              </h3>
              <p className="text-gray-600 mb-6">
                No hay favoritos que coincidan con &quot;{searchQuery}&quot;
              </p>
              <Button onClick={() => setSearchQuery('')} variant="outline">
                Limpiar búsqueda
              </Button>
            </div>
          ) : favorites.length === 0 ? (
            // Empty state
            <div className="text-center py-12">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t(
                  'common.suppliers.selectFavorites.empty.title',
                  'No tienes favoritos en esta categoría'
                )}
              </h3>
              <p className="text-gray-600 mb-6">
                {t(
                  'common.suppliers.selectFavorites.empty.description',
                  'Busca proveedores y guárdalos en favoritos con el botón ❤️'
                )}
              </p>
              <Button
                onClick={() => {
                  onClose();
                  navigate('/proveedores');
                }}
              >
                <Search className="h-4 w-4 mr-2" />
                {t('suppliers.selectFavorites.empty.cta', 'Buscar proveedores')}
              </Button>
            </div>
          ) : (
            // List of favorites
            <div className="space-y-4">
              {filteredAndSortedFavorites.map((favorite) => {
                const supplier = favorite.supplier;
                const isLoading = loading && selectedSupplier === supplier.id;

                const portfolioImage =
                  supplier.portfolio?.[0]?.url ||
                  supplier.profileImage ||
                  supplier.coverImage ||
                  null;
                const isDeleting = deletingId === supplier.id;

                return (
                  <div
                    key={supplier.id || favorite.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-4">
                      {/* Checkbox para comparar */}
                      <div className="flex items-start pt-4">
                        <input
                          type="checkbox"
                          checked={selectedForCompare.includes(supplier.id)}
                          onChange={() => handleToggleCompare(supplier.id)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                          title="Seleccionar para comparar"
                        />
                      </div>
                      {/* Imagen del portfolio */}
                      {portfolioImage ? (
                        <div
                          className="w-32 h-32 flex-shrink-0 cursor-pointer relative group"
                          onClick={() =>
                            supplier.portfolio?.length > 0 && handleViewGallery(supplier.portfolio)
                          }
                        >
                          <img
                            src={portfolioImage}
                            alt={supplier.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          {supplier.portfolio?.length > 1 && (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                Ver {supplier.portfolio.length} fotos
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-32 h-32 flex-shrink-0 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                          <Image className="h-12 w-12 text-purple-300" />
                        </div>
                      )}

                      {/* Supplier info */}
                      <div className="flex-1 min-w-0 p-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{supplier.name}</h3>

                          {/* Badge de seguimiento */}
                          {(() => {
                            const lastContact = getLastContact(supplier.id);
                            const shouldFollowUp = needsFollowUp(supplier.id);
                            const contactDate = lastContact?.timestamp
                              ? new Date(lastContact.timestamp)
                              : null;
                            const isValidContactDate =
                              contactDate && !Number.isNaN(contactDate.getTime());

                            if (shouldFollowUp && lastContact) {
                              return (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                                  ⏰ Seguimiento
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>

                        {/* Rating */}
                        {supplier.rating > 0 && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
                              <span className="text-sm font-medium text-gray-700 ml-1">
                                {supplier.rating.toFixed(1)}
                              </span>
                            </div>
                            {supplier.reviewCount > 0 && (
                              <span className="text-sm text-gray-500">
                                ({supplier.reviewCount})
                              </span>
                            )}
                          </div>
                        )}

                        {/* Location */}
                        {supplier.location &&
                          (supplier.location.city || supplier.location.province) && (
                            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span>
                                {supplier.location.city}
                                {supplier.location.province && `, ${supplier.location.province}`}
                              </span>
                            </div>
                          )}

                        {/* Price range */}
                        {supplier.priceRange && (
                          <div className="text-sm font-medium text-purple-600 mb-2">
                            {supplier.priceRange}
                          </div>
                        )}

                        {/* Último contacto */}
                        {(() => {
                          const lastContact = getLastContact(supplier.id);
                          if (!lastContact) return null;

                          const contactDate = lastContact.timestamp
                            ? new Date(lastContact.timestamp)
                            : null;
                          const isValidContactDate =
                            contactDate && !Number.isNaN(contactDate.getTime());

                          if (!isValidContactDate) return null;

                          const formattedDate =
                            typeof format?.dateShort === 'function'
                              ? format.dateShort(contactDate)
                              : contactDate.toLocaleDateString();

                          const methodIcons = {
                            whatsapp: '💬',
                            email: '📧',
                            phone: '📞',
                            other: '📝',
                          };

                          const icon = methodIcons[lastContact.method] || methodIcons.other;

                          return (
                            <div className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded flex items-center gap-1 mb-2">
                              <span>{icon}</span>
                              <span>Último contacto: {formattedDate}</span>
                              {lastContact.method && (
                                <span className="text-gray-400">vía {lastContact.method}</span>
                              )}
                            </div>
                          );
                        })()}

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {(supplierTags[supplier.id] || []).map((tagId) => {
                            const color = getTagColor(tagId);
                            const colorClasses = {
                              green: 'bg-green-100 text-green-700',
                              purple: 'bg-purple-100 text-purple-700',
                              blue: 'bg-blue-100 text-blue-700',
                              yellow: 'bg-yellow-100 text-yellow-700',
                              pink: 'bg-pink-100 text-pink-700',
                              indigo: 'bg-indigo-100 text-indigo-700',
                              gray: 'bg-gray-100 text-gray-700',
                            };

                            return (
                              <span
                                key={tagId}
                                className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${colorClasses[color]}`}
                              >
                                <Tag className="h-3 w-3" />
                                {getTagLabel(tagId)}
                                <button
                                  onClick={() => handleRemoveTag(supplier.id, tagId)}
                                  className="hover:opacity-70"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            );
                          })}

                          {editingTagsId === supplier.id ? (
                            <div className="flex gap-1 items-center">
                              <input
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddCustomTag(supplier.id, newTag);
                                  } else if (e.key === 'Escape') {
                                    setEditingTagsId(null);
                                    setNewTag('');
                                  }
                                }}
                                placeholder="Tag personalizado..."
                                className="text-xs px-2 py-0.5 border rounded w-32 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                autoFocus
                              />
                              <button
                                onClick={() => handleAddCustomTag(supplier.id, newTag)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingTagsId(null);
                                  setNewTag('');
                                }}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingTagsId(supplier.id)}
                              className="text-xs px-2 py-0.5 border border-dashed border-gray-300 rounded-full text-gray-500 hover:border-gray-400 hover:text-gray-700 flex items-center gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              Tag
                            </button>
                          )}
                        </div>

                        {/* Tags predefinidos (mostrar si está editando) */}
                        {editingTagsId === supplier.id && (
                          <div className="flex flex-wrap gap-1 mb-2 p-2 bg-gray-50 rounded">
                            {PRESET_TAGS.map((tag) => {
                              const isActive = (supplierTags[supplier.id] || []).includes(tag.id);
                              const colorClasses = {
                                green: isActive
                                  ? 'bg-green-600 text-white'
                                  : 'bg-green-100 text-green-700',
                                purple: isActive
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-purple-100 text-purple-700',
                                blue: isActive
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-blue-100 text-blue-700',
                                yellow: isActive
                                  ? 'bg-yellow-600 text-white'
                                  : 'bg-yellow-100 text-yellow-700',
                                pink: isActive
                                  ? 'bg-pink-600 text-white'
                                  : 'bg-pink-100 text-pink-700',
                                indigo: isActive
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-indigo-100 text-indigo-700',
                              };

                              return (
                                <button
                                  key={tag.id}
                                  onClick={() => handleAddTag(supplier.id, tag.id)}
                                  className={`text-xs px-2 py-1 rounded-full transition-colors ${colorClasses[tag.color]}`}
                                >
                                  {tag.label}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Portfolio count */}
                        {supplier.portfolio && supplier.portfolio.length > 0 && (
                          <div className="flex items-center gap-1 text-sm text-purple-600 mb-2">
                            <Image className="h-4 w-4" />
                            <span>
                              {supplier.portfolio.length}{' '}
                              {t('suppliers.selectFavorites.portfolioPhotos', {
                                count: supplier.portfolio.length,
                                defaultValue: 'foto(s)',
                              })}
                            </span>
                          </div>
                        )}

                        {/* Notes - Editable */}
                        {editingNoteId === (favorite.id || supplier.id) ? (
                          <div className="mt-2 flex gap-2">
                            <input
                              type="text"
                              value={editedNote}
                              onChange={(e) => setEditedNote(e.target.value)}
                              className="flex-1 text-sm border border-purple-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              placeholder="Escribe una nota..."
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveNote(supplier.id)}
                              className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="mt-2">
                            {favorite.notes ? (
                              <div className="flex items-start gap-2 bg-yellow-50 p-2 rounded group">
                                <p className="flex-1 text-sm text-gray-600 italic">
                                  💭 {favorite.notes}
                                </p>
                                <button
                                  onClick={() =>
                                    handleStartEditNote(favorite.id || supplier.id, favorite.notes)
                                  }
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-600 hover:text-purple-700"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleStartEditNote(favorite.id || supplier.id, '')}
                                className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                              >
                                <Edit3 className="h-3 w-3" />
                                Agregar nota
                              </button>
                            )}
                          </div>
                        )}

                        {/* Botones de acción */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Button
                            onClick={() => handleAssign(supplier)}
                            disabled={isLoading || isDeleting}
                            size="sm"
                            className="flex-1 min-w-[120px]"
                          >
                            {isLoading && selectedSupplier === supplier.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                {t('suppliers.selectFavorites.assign.loading', 'Asignando...')}
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {t('suppliers.selectFavorites.assign.action', 'Asignar')}
                              </>
                            )}
                          </Button>

                          <Button
                            onClick={() => handleRequestQuote(supplier)}
                            disabled={isLoading || isDeleting}
                            size="sm"
                            variant="outline"
                            className="flex-1 min-w-[120px]"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            {t('suppliers.selectFavorites.requestQuote', {
                              defaultValue: 'Presupuesto',
                            })}
                          </Button>

                          <Button
                            onClick={() => handleDelete(supplier.id, supplier.name)}
                            disabled={isLoading || isDeleting}
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {isDeleting ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {favorites.length > 0 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                navigate('/proveedores');
              }}
              className="w-full"
            >
              <Search className="h-4 w-4 mr-2" />
              {t('suppliers.selectFavorites.footer.more', 'Buscar más proveedores')}
            </Button>
          </div>
        )}
      </div>

      {/* Modal de Solicitar Presupuesto */}
      {quoteSupplier && (
        <RequestQuoteModal
          supplier={quoteSupplier}
          weddingInfo={weddingProfile}
          open={showQuoteModal}
          onClose={() => {
            setShowQuoteModal(false);
            setQuoteSupplier(null);
          }}
          onSuccess={() => {
            toast.success(
              t('suppliers.requestQuoteModal.toasts.success', {
                defaultValue: 'Presupuesto solicitado correctamente',
              })
            );
            setShowQuoteModal(false);
            setQuoteSupplier(null);
          }}
        />
      )}

      {/* Galería de imágenes */}
      {showGallery && (
        <ImageGalleryModal
          images={galleryImages}
          initialIndex={0}
          onClose={() => setShowGallery(false)}
        />
      )}

      {/* Modal de Comparación */}
      {showComparison && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
            {/* Header Comparación */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <GitCompare className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Comparar Proveedores ({selectedForCompare.length})
                </h2>
              </div>
              <button
                onClick={() => setShowComparison(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Tabla de Comparación */}
            <div className="flex-1 overflow-auto p-6">
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${selectedForCompare.length}, 1fr)` }}
              >
                {selectedForCompare.map((supplierId) => {
                  const favorite = favorites.find((f) => f.supplier.id === supplierId);
                  if (!favorite) return null;
                  const supplier = favorite.supplier;

                  return (
                    <div
                      key={supplier.id}
                      className="border border-gray-200 rounded-lg p-4 space-y-3"
                    >
                      {/* Imagen */}
                      <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                        {supplier.portfolio?.[0]?.url ? (
                          <img
                            src={supplier.portfolio[0].url}
                            alt={supplier.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                            <Image className="h-12 w-12 text-purple-300" />
                          </div>
                        )}
                      </div>

                      {/* Nombre */}
                      <h3 className="font-bold text-lg text-gray-900 truncate">{supplier.name}</h3>

                      {/* Rating */}
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Valoración</p>
                        {supplier.rating > 0 ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
                            <span className="font-medium">{supplier.rating.toFixed(1)}</span>
                            {supplier.reviewCount > 0 && (
                              <span className="text-sm text-gray-500">
                                ({supplier.reviewCount})
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">Sin valoraciones</p>
                        )}
                      </div>

                      {/* Precio */}
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Precio</p>
                        {supplier.priceRange ? (
                          <p className="font-medium text-purple-600">{supplier.priceRange}</p>
                        ) : (
                          <p className="text-sm text-gray-400">No especificado</p>
                        )}
                      </div>

                      {/* Ubicación */}
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Ubicación</p>
                        {supplier.location?.city ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <p className="text-sm">
                              {supplier.location.city}
                              {supplier.location.province && `, ${supplier.location.province}`}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">No especificada</p>
                        )}
                      </div>

                      {/* Portfolio */}
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Portfolio</p>
                        {supplier.portfolio?.length > 0 ? (
                          <p className="text-sm">
                            {supplier.portfolio.length} foto
                            {supplier.portfolio.length !== 1 ? 's' : ''}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400">Sin fotos</p>
                        )}
                      </div>

                      {/* Notas */}
                      {favorite.notes && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase">Notas</p>
                          <p className="text-sm italic bg-yellow-50 p-2 rounded">
                            {favorite.notes}
                          </p>
                        </div>
                      )}

                      {/* Botones */}
                      <div className="pt-3 border-t space-y-2">
                        <Button
                          onClick={() => {
                            setShowComparison(false);
                            handleAssign(supplier);
                          }}
                          size="sm"
                          className="w-full"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Asignar
                        </Button>
                        <Button
                          onClick={() => {
                            setShowComparison(false);
                            handleRequestQuote(supplier);
                          }}
                          size="sm"
                          variant="outline"
                          className="w-full"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Presupuesto
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50">
              <Button variant="outline" onClick={() => setShowComparison(false)} className="w-full">
                Cerrar comparación
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
