/**
 * Hook para gestionar las categorías/servicios activos de una boda
 * Permite al owner personalizar qué servicios necesita
 * Auto-añade servicios cuando guarda favoritos de nuevas categorías
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from './useAuth';
import { useWedding } from '../context/WeddingContext';
import { SUPPLIER_CATEGORIES } from '../../shared/supplierCategories';
import { toast } from 'react-toastify';

export function useWeddingCategories() {
  const { user } = useAuth();
  const { activeWedding } = useWedding();
  const [activeCategories, setActiveCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Categorías por defecto para bodas nuevas (las más comunes)
  const DEFAULT_CATEGORIES = [
    'fotografia',
    'video',
    'catering',
    'venue',
    'musica',
    'flores',
    'decoracion',
    'tarta',
  ];

  // Cargar categorías activas de la boda
  const loadActiveCategories = useCallback(async () => {
    if (!user?.uid || !activeWedding) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const weddingRef = doc(db, 'users', user.uid, 'weddings', activeWedding);
      const weddingDoc = await getDoc(weddingRef);

      if (weddingDoc.exists()) {
        const data = weddingDoc.data();
        // Si no tiene categorías, usar defaults
        const categories = data.activeCategories || DEFAULT_CATEGORIES;
        setActiveCategories(categories);
      } else {
        setActiveCategories(DEFAULT_CATEGORIES);
      }
    } catch (error) {
      console.error('Error loading active categories:', error);
      setActiveCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, activeWedding]);

  // Actualizar categorías activas
  const updateActiveCategories = async (categories) => {
    if (!user?.uid || !activeWedding) {
      throw new Error('Usuario o boda no disponible');
    }

    try {
      const weddingRef = doc(db, 'users', user.uid, 'weddings', activeWedding);
      await updateDoc(weddingRef, {
        activeCategories: categories,
        updatedAt: new Date().toISOString(),
      });

      setActiveCategories(categories);
      toast.success('Servicios actualizados correctamente');
    } catch (error) {
      console.error('Error updating active categories:', error);
      toast.error('Error al actualizar servicios');
      throw error;
    }
  };

  // Añadir una categoría (por ejemplo, al guardar favorito de nueva categoría)
  const addCategory = async (categoryId) => {
    if (!activeCategories.includes(categoryId)) {
      const newCategories = [...activeCategories, categoryId];
      await updateActiveCategories(newCategories);

      const category = SUPPLIER_CATEGORIES.find((c) => c.id === categoryId);
      toast.info(`Servicio "${category?.name || categoryId}" añadido a tu boda`);
    }
  };

  // Remover una categoría
  const removeCategory = async (categoryId) => {
    const newCategories = activeCategories.filter((id) => id !== categoryId);
    await updateActiveCategories(newCategories);
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
      .filter(Boolean); // Filtrar undefined
  }, [activeCategories]);

  // Verificar si una categoría está activa
  const isCategoryActive = (categoryId) => {
    return activeCategories.includes(categoryId);
  };

  useEffect(() => {
    loadActiveCategories();
  }, [loadActiveCategories]);

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
