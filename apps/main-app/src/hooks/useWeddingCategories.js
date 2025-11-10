/**
 * Hook para gestionar las categorías/servicios activos de una boda
 * Permite al owner personalizar qué servicios necesita
 * Auto-añade servicios cuando guarda favoritos de nuevas categorías
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from './useAuth';
import { useWedding } from '../context/WeddingContext';
import { SUPPLIER_CATEGORIES } from '../shared/supplierCategories';
import { toast } from 'react-toastify';

export function useWeddingCategories() {
  const { user } = useAuth();
  const { activeWedding } = useWedding();
  const [activeCategories, setActiveCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // ⚡ DINÁMICO: Categorías por defecto basadas en coverage (alta/media)
  // Esto garantiza que siempre usamos IDs válidos de SUPPLIER_CATEGORIES
  const DEFAULT_CATEGORIES = SUPPLIER_CATEGORIES.filter(
    (cat) => cat.coverage === 'high' || cat.coverage === 'medium'
  )
    .slice(0, 8) // Limitar a las 8 más importantes
    .map((cat) => cat.id);

  // ⚡ OPTIMIZACIÓN: Usar onSnapshot para actualización en tiempo real
  // Esto permite que las tarjetas se actualicen instantáneamente sin recargar
  useEffect(() => {
    if (!user?.uid || !activeWedding) {
      setLoading(false);
      setActiveCategories(DEFAULT_CATEGORIES);
      return;
    }

    console.log('🔄 [useWeddingCategories] Iniciando listener en tiempo real...');
    setLoading(true);

    const weddingRef = doc(db, 'users', user.uid, 'weddings', activeWedding);

    // ✅ LISTENER EN TIEMPO REAL: Se actualiza automáticamente cuando cambia Firestore
    const unsubscribe = onSnapshot(
      weddingRef,
      (snapshot) => {
        console.log('📡 [useWeddingCategories] Snapshot recibido');

        if (snapshot.exists()) {
          const data = snapshot.data();
          const categories = data.activeCategories || DEFAULT_CATEGORIES;

          console.log('   ✅ Categorías actualizadas:', categories);
          setActiveCategories(categories);
        } else {
          console.log('   ⚠️ Documento no existe, usando defaults');
          setActiveCategories(DEFAULT_CATEGORIES);
        }

        setLoading(false);
      },
      (error) => {
        console.error('❌ [useWeddingCategories] Error en snapshot:', error);
        setActiveCategories(DEFAULT_CATEGORIES);
        setLoading(false);
      }
    );

    // Cleanup: Desuscribirse cuando el componente se desmonte o cambien las dependencias
    return () => {
      console.log('🔌 [useWeddingCategories] Deteniendo listener...');
      unsubscribe();
    };
  }, [user?.uid, activeWedding]);

  // Actualizar categorías activas
  const updateActiveCategories = async (categories) => {
    if (!user?.uid || !activeWedding) {
      throw new Error('Usuario o boda no disponible');
    }

    try {
      console.log('📝 [useWeddingCategories] Actualizando categorías activas...');
      console.log('   Antes:', activeCategories);
      console.log('   Después:', categories);

      const weddingRef = doc(db, 'users', user.uid, 'weddings', activeWedding);
      await updateDoc(weddingRef, {
        activeCategories: categories,
        updatedAt: new Date().toISOString(),
      });

      // ⚠️ CRÍTICO: Crear una NUEVA referencia del array para que React detecte el cambio
      setActiveCategories([...categories]);
      console.log('   ✅ Estado actualizado en hook (nueva referencia del array)');
      console.log('   Nueva referencia:', [...categories]);
      // No mostrar toast aquí - se muestra en addCategory/removeCategory
    } catch (error) {
      console.error('Error updating active categories:', error);
      toast.error('Error al actualizar servicios');
      throw error;
    }
  };

  // Añadir una categoría (por ejemplo, al guardar favorito de nueva categoría)
  const addCategory = async (categoryId) => {
    console.log('➕ [useWeddingCategories] addCategory:', categoryId);

    if (!activeCategories.includes(categoryId)) {
      const newCategories = [...activeCategories, categoryId];
      const category = SUPPLIER_CATEGORIES.find((c) => c.id === categoryId);

      console.log('   Añadiendo categoría:', category?.name);
      await updateActiveCategories(newCategories);

      toast.success(`✅ "${category?.name || categoryId}" añadido`);
    } else {
      console.log('   ⚠️ Ya está activa, no se hace nada');
    }
  };

  // Remover una categoría
  const removeCategory = async (categoryId) => {
    console.log('➖ [useWeddingCategories] removeCategory:', categoryId);

    const category = SUPPLIER_CATEGORIES.find((c) => c.id === categoryId);
    console.log('   Removiendo categoría:', category?.name);

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
      .filter(Boolean); // Filtrar undefined
  }, [activeCategories]);

  // Verificar si una categoría está activa
  // ⭐ CRÍTICO: Usar useCallback para que la función no se recree en cada render
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
