import { useState, useEffect } from 'react';
import { db, firebaseReady } from '../../../firebaseConfig';
import { ALL_DESIGN_ASSETS, loadExpandedAssets } from '../data/mockAssets';

const fsImport = () => import('firebase/firestore');

export function useDesignAssets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;

    const loadAssets = async () => {
      try {
        const expandedAssets = await loadExpandedAssets();
        
        await firebaseReady;
        const { collection, query, limit, onSnapshot } = await fsImport();

        const assetsRef = collection(db, 'designAssets');
        const q = query(assetsRef, limit(100));

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            let assetsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            if (assetsData.length === 0) {
              assetsData = expandedAssets;
            } else {
              assetsData = [...assetsData, ...expandedAssets];
            }

            setAssets(assetsData);
            setLoading(false);
          },
          (err) => {
            console.error('Error loading assets from Firestore, using expanded data:', err);
            setAssets(expandedAssets);
            setError(null);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error('Error setting up assets listener, using mock data:', err);
        const expandedAssets = await loadExpandedAssets();
        setAssets(expandedAssets);
        setError(null);
        setLoading(false);
      }
    };

    loadAssets();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return { assets, loading, error };
}
