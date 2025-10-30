import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, doc, setDoc, deleteDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const SupplierFavoritesContext = createContext();

export function useSupplierFavorites() {
  const context = useContext(SupplierFavoritesContext);
  if (!context) {
    throw new Error('useSupplierFavorites must be used within SupplierFavoritesProvider');
  }
  return context;
}

export function SupplierFavoritesProvider({ children }) {
  const { currentUser } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar favoritos del usuario
  useEffect(() => {
    if (!currentUser) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    loadFavorites();
  }, [currentUser]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const favoritesRef = collection(db, 'users', currentUser.uid, 'favorites');
      const q = query(favoritesRef, orderBy('addedAt', 'desc'));
      const snapshot = await getDocs(q);

      const favoritesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setFavorites(favoritesData);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  // Añadir a favoritos
  const addToFavorites = async (supplier) => {
    if (!currentUser) {
      throw new Error('Debes iniciar sesión para añadir favoritos');
    }

    try {
      const favoriteData = {
        supplierId: supplier.id || supplier.slug,
        supplierName: supplier.name,
        category: supplier.category || supplier.service,
        addedAt: new Date(),

        // Snapshot del proveedor
        supplier: {
          name: supplier.name,
          category: supplier.category || supplier.service,
          contact: supplier.contact || {},
          location: supplier.location || {},
          rating: supplier.rating,
          reviewCount: supplier.reviewCount,
          images: supplier.images || [],
          description: supplier.business?.description || supplier.description,
          priceRange: supplier.priceRange,
          priority: supplier.priority,
        },

        // Notas del usuario (vacías por defecto)
        notes: '',
        tags: [],
      };

      const favoriteRef = doc(
        db,
        'users',
        currentUser.uid,
        'favorites',
        supplier.id || supplier.slug
      );
      await setDoc(favoriteRef, favoriteData);

      // Actualizar estado local
      setFavorites((prev) => [favoriteData, ...prev]);

      return true;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  };

  // Quitar de favoritos
  const removeFromFavorites = async (supplierId) => {
    if (!currentUser) {
      throw new Error('Debes iniciar sesión');
    }

    try {
      const favoriteRef = doc(db, 'users', currentUser.uid, 'favorites', supplierId);
      await deleteDoc(favoriteRef);

      // Actualizar estado local
      setFavorites((prev) => prev.filter((fav) => fav.supplierId !== supplierId));

      return true;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  };

  // Verificar si está en favoritos
  const isFavorite = (supplierId) => {
    return favorites.some((fav) => fav.supplierId === supplierId);
  };

  // Actualizar notas de favorito
  const updateFavoriteNotes = async (supplierId, notes) => {
    if (!currentUser) return;

    try {
      const favoriteRef = doc(db, 'users', currentUser.uid, 'favorites', supplierId);
      await setDoc(favoriteRef, { notes }, { merge: true });

      // Actualizar estado local
      setFavorites((prev) =>
        prev.map((fav) => (fav.supplierId === supplierId ? { ...fav, notes } : fav))
      );
    } catch (error) {
      console.error('Error updating favorite notes:', error);
      throw error;
    }
  };

  // Añadir tags a favorito
  const updateFavoriteTags = async (supplierId, tags) => {
    if (!currentUser) return;

    try {
      const favoriteRef = doc(db, 'users', currentUser.uid, 'favorites', supplierId);
      await setDoc(favoriteRef, { tags }, { merge: true });

      // Actualizar estado local
      setFavorites((prev) =>
        prev.map((fav) => (fav.supplierId === supplierId ? { ...fav, tags } : fav))
      );
    } catch (error) {
      console.error('Error updating favorite tags:', error);
      throw error;
    }
  };

  // Obtener favoritos por categoría
  const getFavoritesByCategory = (category) => {
    if (!category) return favorites;
    return favorites.filter((fav) => fav.category === category);
  };

  // Contar favoritos
  const favoritesCount = favorites.length;

  // Obtener categorías con favoritos
  const categoriesWithFavorites = [...new Set(favorites.map((fav) => fav.category))];

  const value = {
    favorites,
    loading,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    updateFavoriteNotes,
    updateFavoriteTags,
    getFavoritesByCategory,
    favoritesCount,
    categoriesWithFavorites,
    refreshFavorites: loadFavorites,
  };

  return (
    <SupplierFavoritesContext.Provider value={value}>{children}</SupplierFavoritesContext.Provider>
  );
}
