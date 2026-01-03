import { useState, useEffect, useCallback } from 'react';
import { useWedding } from '../context/WeddingContext';
import { specialMomentsAPI } from '../services/apiService';

export const RESPONSABLES_LIMIT = 12;
export const SUPPLIERS_LIMIT = 12;
export const SONG_CANDIDATES_LIMIT = 10;

const DEFAULT_BLOCKS = [
  { id: 'ceremonia', name: 'Ceremonia', order: 1, backgroundPlaylist: null },
  { id: 'coctail', name: 'Cóctel', order: 2, backgroundPlaylist: null },
  { id: 'banquete', name: 'Banquete', order: 3, backgroundPlaylist: null },
  { id: 'disco', name: 'Disco', order: 4, backgroundPlaylist: null },
];

export const MAX_MOMENTS_PER_BLOCK = 200;

export default function useSpecialMoments() {
  const { activeWedding } = useWedding();
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS);
  const [moments, setMoments] = useState({
    ceremonia: [],
    coctail: [],
    banquete: [],
    disco: [],
  });
  const [loading, setLoading] = useState(false);

  const loadMoments = useCallback(async () => {
    if (!activeWedding) return;
    
    setLoading(true);
    try {
      const allMoments = await specialMomentsAPI.getAll(activeWedding);
      
      const grouped = {
        ceremonia: [],
        coctail: [],
        banquete: [],
        disco: [],
      };
      
      allMoments.forEach(moment => {
        const blockId = moment.blockId || 'ceremonia';
        if (grouped[blockId]) {
          grouped[blockId].push({
            id: moment.id,
            order: grouped[blockId].length + 1,
            title: moment.title,
            song: moment.songTitle || '',
            artist: moment.artist || '',
            spotifyId: moment.spotifyId || '',
            time: moment.time || '',
            duration: moment.duration || '15',
            type: moment.type || 'otro',
            state: moment.status || 'pendiente',
            responsables: moment.responsible ? [{ name: moment.responsible }] : [],
            recipientId: '',
            recipientName: '',
            recipientRole: '',
            musicDescription: moment.notes || '',
            songCandidates: [],
            selectedSongId: null,
          });
        }
      });
      
      setMoments(grouped);
    } catch (error) {
      console.error('Error loading special moments:', error);
    } finally {
      setLoading(false);
    }
  }, [activeWedding]);

  useEffect(() => {
    loadMoments();
  }, [loadMoments]);

  const addMoment = useCallback(async (blockId, momentData) => {
    if (!activeWedding) return;

    const blockMoments = moments[blockId] || [];
    if (blockMoments.length >= MAX_MOMENTS_PER_BLOCK) {
      throw new Error(`Máximo ${MAX_MOMENTS_PER_BLOCK} momentos por bloque`);
    }

    try {
      const created = await specialMomentsAPI.create(activeWedding, {
        blockId,
        title: momentData.title,
        time: momentData.time || null,
        duration: momentData.duration || '15',
        songTitle: momentData.song || null,
        artist: momentData.artist || null,
        spotifyId: momentData.spotifyId || null,
        responsible: momentData.responsables?.[0]?.name || null,
        status: momentData.state || 'pendiente',
        type: momentData.type || 'otro',
        notes: momentData.musicDescription || null,
      });

      const newMoment = {
        id: created.id,
        order: blockMoments.length + 1,
        ...momentData,
      };

      setMoments(prev => ({
        ...prev,
        [blockId]: [...(prev[blockId] || []), newMoment],
      }));

      return newMoment;
    } catch (error) {
      console.error('Error adding moment:', error);
      throw error;
    }
  }, [activeWedding, moments]);

  const updateMoment = useCallback(async (blockId, momentId, updates) => {
    if (!activeWedding) return;

    setMoments(prev => ({
      ...prev,
      [blockId]: (prev[blockId] || []).map(m =>
        m.id === momentId ? { ...m, ...updates } : m
      ),
    }));

    try {
      await specialMomentsAPI.update(momentId, {
        title: updates.title,
        time: updates.time,
        duration: updates.duration,
        songTitle: updates.song,
        artist: updates.artist,
        spotifyId: updates.spotifyId,
        responsible: updates.responsables?.[0]?.name,
        status: updates.state,
        type: updates.type,
        notes: updates.musicDescription,
      });
    } catch (error) {
      console.error('Error updating moment:', error);
      await loadMoments();
    }
  }, [activeWedding, loadMoments]);

  const deleteMoment = useCallback(async (blockId, momentId) => {
    if (!activeWedding) return;

    setMoments(prev => ({
      ...prev,
      [blockId]: (prev[blockId] || []).filter(m => m.id !== momentId),
    }));

    try {
      await specialMomentsAPI.delete(momentId);
    } catch (error) {
      console.error('Error deleting moment:', error);
      await loadMoments();
    }
  }, [activeWedding, loadMoments]);

  const reorderMoments = useCallback(async (blockId, newOrder) => {
    if (!activeWedding) return;

    const reordered = newOrder.map((moment, index) => ({
      ...moment,
      order: index + 1,
    }));

    setMoments(prev => ({
      ...prev,
      [blockId]: reordered,
    }));

    try {
      await Promise.all(
        reordered.map(moment =>
          specialMomentsAPI.update(moment.id, { notes: `order:${moment.order}` })
        )
      );
    } catch (error) {
      console.error('Error reordering moments:', error);
    }
  }, [activeWedding]);

  const clearBlock = useCallback(async (blockId) => {
    if (!activeWedding) return;

    setMoments(prev => ({
      ...prev,
      [blockId]: [],
    }));

    try {
      await specialMomentsAPI.deleteBlock(activeWedding, blockId);
    } catch (error) {
      console.error('Error clearing block:', error);
      await loadMoments();
    }
  }, [activeWedding, loadMoments]);

  const updateBlockPlaylist = useCallback((blockId, playlist) => {
    setBlocks(prev =>
      prev.map(block =>
        block.id === blockId
          ? { ...block, backgroundPlaylist: playlist }
          : block
      )
    );
  }, []);

  return {
    blocks,
    moments,
    loading,
    addMoment,
    updateMoment,
    deleteMoment,
    reorderMoments,
    clearBlock,
    updateBlockPlaylist,
    loadMoments,
  };
}
