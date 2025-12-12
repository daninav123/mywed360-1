/**
 * TimelinePage - Página del Timeline Personalizado
 * FASE 0.2 del WORKFLOW-USUARIO.md
 */
import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useWedding } from '../context/WeddingContext';
import TimelineView from '../components/timeline/TimelineView';
import PageWrapper from '../components/PageWrapper';
import { toast } from 'react-toastify';

export default function TimelinePage() {
  const { activeWedding, activeWeddingData } = useWedding();
  const [completedTasks, setCompletedTasks] = useState({});
  const [loading, setLoading] = useState(true);

  const weddingDate = activeWeddingData?.weddingDate 
    ? new Date(activeWeddingData.weddingDate.seconds * 1000)
    : activeWeddingData?.date
    ? new Date(activeWeddingData.date.seconds * 1000)
    : null;

  useEffect(() => {
    if (!activeWedding) {
      setLoading(false);
      return;
    }

    const loadCompletedTasks = async () => {
      try {
        const docRef = doc(db, 'weddings', activeWedding, 'planning', 'timeline');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setCompletedTasks(docSnap.data().completedTasks || {});
        }
      } catch (error) {
        console.error('Error loading timeline:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCompletedTasks();
  }, [activeWedding]);

  const handleTaskToggle = useCallback(async (task) => {
    if (!activeWedding) return;

    const { blockKey, index, completed } = task;
    const newCompleted = !completed;

    const updatedTasks = { ...completedTasks };
    if (!updatedTasks[blockKey]) {
      updatedTasks[blockKey] = [];
    }

    if (newCompleted) {
      if (!updatedTasks[blockKey].includes(index)) {
        updatedTasks[blockKey].push(index);
      }
    } else {
      updatedTasks[blockKey] = updatedTasks[blockKey].filter(i => i !== index);
    }

    setCompletedTasks(updatedTasks);

    try {
      const docRef = doc(db, 'weddings', activeWedding, 'planning', 'timeline');
      await setDoc(docRef, {
        completedTasks: updatedTasks,
        updatedAt: new Date(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving timeline:', error);
      toast.error('Error al guardar el progreso');
      setCompletedTasks(completedTasks);
    }
  }, [activeWedding, completedTasks]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando timeline...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <TimelineView
          weddingDate={weddingDate}
          completedTasks={completedTasks}
          onTaskToggle={handleTaskToggle}
        />
      </div>
    </PageWrapper>
  );
}
