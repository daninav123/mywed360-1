/**
 * PhotoShotListPage - Página de Shot List Fotográfico
 * FASE 3.1.5 del WORKFLOW-USUARIO.md
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useWedding } from '../context/WeddingContext';
import PhotoShotList from '../components/shotlist/PhotoShotList';
import PageWrapper from '../components/PageWrapper';
import { toast } from 'react-toastify';

export default function PhotoShotListPage() {
  const { activeWedding, activeWeddingData } = useWedding();
  const [completedShots, setCompletedShots] = useState({});
  const [loading, setLoading] = useState(true);

  const weddingCouple = activeWeddingData?.coupleName || 
    `${activeWeddingData?.partner1Name || ''} & ${activeWeddingData?.partner2Name || ''}`.trim();

  useEffect(() => {
    if (!activeWedding) {
      setLoading(false);
      return;
    }

    const loadShotList = async () => {
      try {
        const docRef = doc(db, 'weddings', activeWedding, 'photography', 'shotlist');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setCompletedShots(docSnap.data().completedShots || {});
        }
      } catch (error) {
        console.error('Error loading shot list:', error);
      } finally {
        setLoading(false);
      }
    };

    loadShotList();
  }, [activeWedding]);

  const handleToggleShot = useCallback(async (categoryId, shotId) => {
    if (!activeWedding) return;

    const updatedShots = { ...completedShots };
    if (!updatedShots[categoryId]) {
      updatedShots[categoryId] = [];
    }

    const index = updatedShots[categoryId].indexOf(shotId);
    if (index > -1) {
      updatedShots[categoryId] = updatedShots[categoryId].filter(id => id !== shotId);
    } else {
      updatedShots[categoryId].push(shotId);
    }

    setCompletedShots(updatedShots);

    try {
      const docRef = doc(db, 'weddings', activeWedding, 'photography', 'shotlist');
      await setDoc(docRef, {
        completedShots: updatedShots,
        updatedAt: new Date(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving shot list:', error);
      toast.error('Error al guardar el progreso');
      setCompletedShots(completedShots);
    }
  }, [activeWedding, completedShots]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('photoShots.descriptionPlaceholder')}</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <PhotoShotList
          completedShots={completedShots}
          onToggleShot={handleToggleShot}
          weddingCouple={weddingCouple}
          placeholder={t('photoShots.searchPlaceholder')}
        />
      </div>
    </PageWrapper>
  );
}
