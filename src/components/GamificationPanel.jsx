import React, { useEffect, useState, useMemo } from 'react';
import { getSummary } from '../services/gamificationService';
import { useUserContext } from '../context/UserContext';
import { useAuth } from '../hooks/useAuthUnified';
import { Card } from './ui/Card';
import { Progress } from './ui/Progress';

export default function GamificationPanel() {
  const { user } = useUserContext();
  const { currentUser, userProfile } = useAuth();
  const authUser = useMemo(() => ({
    uid: currentUser?.uid || user?.uid,
    email: currentUser?.email || user?.email,
  }), [currentUser, user]);

  const [data, setData] = useState({ points: 0, level: 1, progressToNext: 0 });
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!authUser?.uid) return;
        const s = await getSummary(authUser);
        if (mounted) setData(s);
      } catch (e) {
        // No bloquear Home si el backend no est?disponible
        setError(e?.message || '');
      }
    })();
    return () => { mounted = false; };
  }, [authUser?.uid]);

  return (
    <Card className="p-4 bg-[var(--color-surface)]/80 backdrop-blur-md">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold text-[color:var(--color-text)]">Progreso</h3>
          <p className="text-sm text-[color:var(--color-text)]/70">Nivel {data.level} ?{data.points} pts</p>
        </div>
        <div className="text-xs text-[color:var(--color-text)]/60">
          {Math.round((data.progressToNext || 0) * 100)}%
        </div>
      </div>
      <Progress value={(data.progressToNext || 0) * 100} />
      {error && <div className="mt-2 text-xs text-red-500">{error}</div>}
    </Card>
  );
}

