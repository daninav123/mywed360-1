import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './useAuth';
import { useWedding } from '../context/WeddingContext';
import { SUPPLIER_CATEGORIES } from '../shared/supplierCategories';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004/api';

export function useWeddingCategories() {
  const { currentUser } = useAuth();
  const { activeWedding } = useWedding();
  const [activeCategories, setActiveCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Categorías por defecto basadas en coverage (alta/media)
  const DEFAULT_CATEGORIES = SUPPLIER_CATEGORIES.filter(
    (cat) => cat.coverage === 'high' || cat.coverage === 'medium'
  )
    .slice(0, 8)
    .map((cat) => cat.id);

  // Cargar categorías desde PostgreSQL
  useEffect(() => {
    if (!activeWedding) {
      setLoading(false);
      setActiveCategories(DEFAULT_CATEGORIES);
      return;
    }

    const loadCategories = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        
        const response = await axios.get(
          `${API_URL}/wedding-categories/${activeWedding}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          const categories = response.data.data.activeCategories || DEFAULT_CATEGORIES;
          setActiveCategories(categories);
        } else {
          setActiveCategories(DEFAULT_CATEGORIES);
        }
      } catch (error) {
        console.error('[useWeddingCategories] Error loading:', error);
        setActiveCategories(DEFAULT_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [activeWedding]);

  // Actualizar categorías activas
  const updateActiveCategories = async (categories) => {
    if (!activeWedding) {
      throw new Error('Boda no disponible');
    }

    try {
      const token = localStorage.getItem('authToken');

      // Convertir IDs de categorías a nombres completos para wantedServices
      const categoryNames = categories
        .map((catId) => SUPPLIER_CATEGORIES.find((c) => c.id === catId)?.name)
        .filter(Boolean);

      const response = await axios.put(
        `${API_URL}/wedding-categories/${activeWedding}`,
        {
          activeCategories: categories,
          wantedServices: categoryNames
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setActiveCategories([...categories]);
      }
    } catch (error) {
      console.error('[useWeddingCategories] Error updating:', error);
      toast.error('Error al actualizar servicios');
      throw error;
    }
  };

  // Añadir una categoría
  const addCategory = async (categoryId) => {
    if (!activeCategories.includes(categoryId)) {
      const newCategories = [...activeCategories, categoryId];
      const category = SUPPLIER_CATEGORIES.find((c) => c.id === categoryId);

      await updateActiveCategories(newCategories);
      toast.success(`✅ "${category?.name || categoryId}" añadido`);
    }
  };

  // Remover una categoría
  const removeCategory = async (categoryId) => {
    const category = SUPPLIER_CATEGORIES.find((c) => c.id === categoryId);
    const newCategories = activeCategories.filter((id) => id !== categoryId);
    
    await updateActiveCategories(newCategories);
    toast.info(`❌ "${category?.name || categoryId}" desactivado`);
  };

  // Alternar categoría (activar/desactivar)
  const toggleCategory = async (categoryId) => {
    if (activeCategories.includes(categoryId)) {
      await removeCategory(categoryId);
    } else {
      await addCategory(categoryId);
    }
  };

  // Obtener detalles de categorías activas
  const getActiveCategoriesDetails = useCallback(() => {
    return activeCategories
      .map((id) => SUPPLIER_CATEGORIES.find((cat) => cat.id === id))
      .filter(Boolean);
  }, [activeCategories]);

  // Verificar si una categoría está activa
  const isCategoryActive = useCallback(
    (categoryId) => {
      return activeCategories.includes(categoryId);
    },
    [activeCategories]
  );

  return {
    activeCategories,
    loading,
    updateActiveCategories,
    addCategory,
    removeCategory,
    toggleCategory,
    getActiveCategoriesDetails,
    isCategoryActive,
    allCategories: SUPPLIER_CATEGORIES,
  };
}
