import { useState, useEffect, useCallback } from 'react';
import { useWedding } from '../context/WeddingContext';
import { timelineAPI } from '../services/apiService';

const BLOCK_STATES = {
  ON_TIME: 'on-time',
  SLIGHTLY_DELAYED: 'slightly-delayed',
  DELAYED: 'delayed',
};

const STATE_COLORS = {
  [BLOCK_STATES.ON_TIME]: 'green',
  [BLOCK_STATES.SLIGHTLY_DELAYED]: 'yellow',
  [BLOCK_STATES.DELAYED]: 'red',
};

const DEFAULT_BLOCKS = [
  {
    id: 'preparativos',
    name: 'Preparativos',
    startTime: '08:00',
    endTime: '11:00',
    status: BLOCK_STATES.ON_TIME,
    alerts: [],
    moments: [],
  },
  {
    id: 'ceremonia',
    name: 'Ceremonia',
    startTime: '11:00',
    endTime: '12:30',
    status: BLOCK_STATES.ON_TIME,
    alerts: [],
    moments: [],
  },
  {
    id: 'coctel',
    name: 'Cóctel',
    startTime: '12:30',
    endTime: '14:00',
    status: BLOCK_STATES.ON_TIME,
    alerts: [],
    moments: [],
  },
  {
    id: 'banquete',
    name: 'Banquete',
    startTime: '14:00',
    endTime: '18:00',
    status: BLOCK_STATES.ON_TIME,
    alerts: [],
    moments: [],
  },
  {
    id: 'fiesta',
    name: 'Fiesta',
    startTime: '18:00',
    endTime: '02:00',
    status: BLOCK_STATES.ON_TIME,
    alerts: [],
    moments: [],
  },
];

export default function useTimelinePostgres() {
  const { activeWedding } = useWedding();
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS);
  const [alerts, setAlerts] = useState([]);
  const [automaticAlerts, setAutomaticAlerts] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadTimeline = useCallback(async () => {
    if (!activeWedding) return;
    
    setLoading(true);
    try {
      const events = await timelineAPI.getAll(activeWedding);
      
      if (events.length === 0) {
        setBlocks(DEFAULT_BLOCKS);
      } else {
        const mappedBlocks = events.map(event => ({
          id: event.notes || event.id,
          name: event.name,
          startTime: event.startTime,
          endTime: event.endTime,
          status: event.status,
          alerts: event.alerts || [],
          moments: event.moments || [],
        }));
        setBlocks(mappedBlocks);
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
      setBlocks(DEFAULT_BLOCKS);
    } finally {
      setLoading(false);
    }
  }, [activeWedding]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  const updateBlock = useCallback(async (blockId, updates) => {
    if (!activeWedding) return;
    
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId ? { ...block, ...updates } : block
      )
    );

    try {
      const block = blocks.find(b => b.id === blockId);
      if (block) {
        await timelineAPI.update(block.id, {
          name: updates.name || block.name,
          startTime: updates.startTime || block.startTime,
          endTime: updates.endTime || block.endTime,
          status: updates.status || block.status,
          moments: updates.moments || block.moments,
          alerts: updates.alerts || block.alerts,
        });
      }
    } catch (error) {
      console.error('Error updating timeline block:', error);
      await loadTimeline();
    }
  }, [activeWedding, blocks, loadTimeline]);

  const setBlockStatus = useCallback((blockId, status) => {
    if (!Object.values(BLOCK_STATES).includes(status)) return;
    updateBlock(blockId, { status });
  }, [updateBlock]);

  const setBlockTimes = useCallback((blockId, startTime, endTime) => {
    updateBlock(blockId, { startTime, endTime });
  }, [updateBlock]);

  const addAlert = useCallback((blockId, alert) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const newAlerts = [...(block.alerts || []), alert];
    updateBlock(blockId, { alerts: newAlerts });
    setAlerts((prev) => [...prev, alert]);
  }, [blocks, updateBlock]);

  const clearBlockAlerts = useCallback((blockId) => {
    updateBlock(blockId, { alerts: [] });
    setAlerts((prev) => prev.filter(a => a.blockId !== blockId));
  }, [updateBlock]);

  const getCurrentBlock = useCallback(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return blocks.find(block => {
      return currentTime >= block.startTime && currentTime <= block.endTime;
    });
  }, [blocks]);

  const getNextBlock = useCallback(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return blocks.find(block => currentTime < block.startTime);
  }, [blocks]);

  const getTimelineSummary = useCallback(() => {
    const byStatus = {
      [BLOCK_STATES.ON_TIME]: 0,
      [BLOCK_STATES.SLIGHTLY_DELAYED]: 0,
      [BLOCK_STATES.DELAYED]: 0,
    };

    blocks.forEach(block => {
      byStatus[block.status]++;
    });

    const currentBlock = getCurrentBlock();
    const nextBlock = getNextBlock();

    return {
      total: blocks.length,
      byStatus,
      currentBlock,
      nextBlock,
      alertCount: alerts.length,
    };
  }, [blocks, alerts, getCurrentBlock, getNextBlock]);

  const saveTimeline = useCallback(async () => {
    if (!activeWedding || blocks.length === 0) return;

    try {
      await timelineAPI.bulkUpdate(activeWedding, blocks.map((block, index) => ({
        name: block.name,
        startTime: block.startTime,
        endTime: block.endTime,
        status: block.status,
        order: index,
        moments: block.moments,
        alerts: block.alerts,
        notes: block.id,
      })));
    } catch (error) {
      console.error('Error saving timeline:', error);
    }
  }, [activeWedding, blocks]);

  return {
    blocks,
    alerts,
    automaticAlerts,
    loading,
    setBlocks,
    updateBlock,
    setBlockStatus,
    setBlockTimes,
    addAlert,
    clearBlockAlerts,
    setAutomaticAlerts,
    getCurrentBlock,
    getNextBlock,
    getTimelineSummary,
    saveTimeline,
    BLOCK_STATES,
    STATE_COLORS,
  };
}
