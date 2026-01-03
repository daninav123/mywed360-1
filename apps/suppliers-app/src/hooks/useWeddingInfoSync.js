import { useEffect, useState, useCallback, useRef } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useWedding } from '../context/WeddingContext';
import useGuests from './useGuests';
import useFinance from './useFinance';

const useWeddingInfoSync = () => {
  const { activeWedding } = useWedding();
  const [syncedData, setSyncedData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const unsubscribesRef = useRef([]);

  const { stats: guestsStats, guests } = useGuests();
  const { 
    totalBudget, 
    totalSpent, 
    categoryBudgets,
    transactions 
  } = useFinance();

  const computeDietaryStats = useCallback((guestsList = []) => {
    const restrictions = {};
    let hasRestrictions = false;
    
    guestsList.forEach(guest => {
      if (guest.dietaryRestrictions && guest.dietaryRestrictions.trim()) {
        hasRestrictions = true;
        const restriction = guest.dietaryRestrictions.toLowerCase();
        if (restriction.includes('vegano') || restriction.includes('vegan')) {
          restrictions.vegan = (restrictions.vegan || 0) + 1;
        }
        if (restriction.includes('vegetariano') || restriction.includes('vegetarian')) {
          restrictions.vegetarian = (restrictions.vegetarian || 0) + 1;
        }
        if (restriction.includes('celiaco') || restriction.includes('celiac') || restriction.includes('gluten')) {
          restrictions.celiac = (restrictions.celiac || 0) + 1;
        }
        if (restriction.includes('lactosa') || restriction.includes('lactose')) {
          restrictions.lactose = (restrictions.lactose || 0) + 1;
        }
        if (restriction.includes('alergia') || restriction.includes('allergy')) {
          restrictions.allergies = (restrictions.allergies || 0) + 1;
        }
      }
    });

    return {
      hasRestrictions,
      summary: restrictions,
      total: Object.values(restrictions).reduce((sum, val) => sum + val, 0)
    };
  }, []);

  useEffect(() => {
    if (!activeWedding) {
      setIsLoading(false);
      return;
    }

    const weddingRef = doc(db, 'weddings', activeWedding);
    
    const unsubscribe = onSnapshot(weddingRef, (snapshot) => {
      if (snapshot.exists()) {
        const weddingData = snapshot.data();
        
        const dietary = computeDietaryStats(guests);
        
        const consolidated = {
          numGuests: guestsStats?.totalInvited || weddingData.numGuests || 0,
          confirmedGuests: guestsStats?.confirmed || 0,
          pendingGuests: guestsStats?.pending || 0,
          declinedGuests: guestsStats?.declined || 0,
          
          totalBudget: totalBudget || weddingData.totalBudget || 0,
          spentAmount: totalSpent || 0,
          remainingBudget: (totalBudget - totalSpent) || 0,
          budgetPercentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
          
          dietaryRestrictions: dietary,
          
          _syncTimestamp: Date.now(),
          _sources: {
            guests: !!guestsStats,
            finance: !!totalBudget,
          }
        };

        setSyncedData(consolidated);
      }
      setIsLoading(false);
    });

    unsubscribesRef.current.push(unsubscribe);

    return () => {
      unsubscribesRef.current.forEach(unsub => unsub?.());
      unsubscribesRef.current = [];
    };
  }, [activeWedding, guestsStats, totalBudget, totalSpent, guests, computeDietaryStats]);

  const propagateChange = useCallback(async (field, value, options = {}) => {
    if (!activeWedding) return;

    const { skipInfoBoda = false, source = 'infoboda' } = options;

    try {
      if (!skipInfoBoda && source === 'infoboda') {
        const weddingRef = doc(db, 'weddings', activeWedding);
        await updateDoc(weddingRef, {
          [field]: value,
          lastUpdated: serverTimestamp(),
          _lastUpdateSource: 'infoboda'
        });
      }

      switch (field) {
        case 'weddingDate':
          break;

        case 'totalBudget':
          if (source === 'infoboda' && categoryBudgets) {
          }
          break;

        case 'numGuests':
          break;

        default:
          break;
      }

    } catch (error) {
      console.error('[useWeddingInfoSync] Error propagating change:', error);
    }
  }, [activeWedding, categoryBudgets]);

  return {
    syncedData,
    isLoading,
    propagateChange,
    
    stats: {
      guests: {
        total: syncedData.numGuests || 0,
        confirmed: syncedData.confirmedGuests || 0,
        pending: syncedData.pendingGuests || 0,
        declined: syncedData.declinedGuests || 0,
      },
      finance: {
        budget: syncedData.totalBudget || 0,
        spent: syncedData.spentAmount || 0,
        remaining: syncedData.remainingBudget || 0,
        percentage: syncedData.budgetPercentage || 0,
      },
      dietary: syncedData.dietaryRestrictions || { hasRestrictions: false, summary: {}, total: 0 },
    }
  };
};

export default useWeddingInfoSync;
