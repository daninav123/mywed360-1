import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004/api';

const toDate = (v) => {
  if (!v) return null;
  try {
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  } catch (_) {
    return null;
  }
};

export default function useWeddingTasksHierarchy(weddingId) {
  const [parents, setParents] = useState([]);
  const [childrenByParent, setChildrenByParent] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!weddingId) {
      setParents([]);
      setChildrenByParent({});
      setLoading(false);
      return;
    }

    const loadTasks = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        
        const response = await axios.get(
          `${API_URL}/tasks-hierarchy/${weddingId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          setParents(response.data.data.parents || []);
          setChildrenByParent(response.data.data.childrenByParent || {});
        }
      } catch (error) {
        console.error('[useWeddingTasksHierarchy] Error loading:', error);
        setParents([]);
        setChildrenByParent({});
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [weddingId]);

  const flatList = useMemo(() => {
    const result = [];
    
    parents.forEach((p) => {
      const children = childrenByParent[p.id] || [];
      const hasChildren = children.length > 0;

      const parentItem = {
        id: p.id,
        name: p.title || 'Sin título',
        start: toDate(p.dueDate),
        end: toDate(p.dueDate),
        progress: p.completed ? 100 : 0,
        type: hasChildren ? 'project' : 'task',
        isParent: true,
        raw: p,
      };

      result.push(parentItem);

      children.forEach((c) => {
        result.push({
          id: c.id,
          name: c.title || 'Subtarea',
          start: toDate(c.dueDate),
          end: toDate(c.dueDate),
          progress: c.completed ? 100 : 0,
          type: 'task',
          project: p.id,
          isChild: true,
          raw: c,
        });
      });
    });

    return result;
  }, [parents, childrenByParent]);

  return {
    parents,
    childrenByParent,
    flatList,
    loading
  };
}
