import { useEffect, useRef } from 'react';
import { collection, getDocs, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useWedding } from '../context/WeddingContext';
import { useAuth } from './useAuth';
import { normalizeBudgetCategoryKey } from '../utils/budgetCategories';

/**
 * Hook para migrar automáticamente proveedores sin serviceLines
 * a la nueva estructura con serviceLines
 */
export default function useProviderMigration() {
  const { activeWedding } = useWedding();
  const { user } = useAuth();
  const migrationRef = useRef(false);

  useEffect(() => {
    if (!activeWedding || !db || !user || migrationRef.current) return;

    const migrateProviders = async () => {
      try {
        migrationRef.current = true;
        
        const providersPath = `weddings/${activeWedding}/providers`;
        const providersRef = collection(db, providersPath);
        const providersSnap = await getDocs(providersRef);

        let migratedCount = 0;

        for (const providerDoc of providersSnap.docs) {
          const provider = { id: providerDoc.id, ...providerDoc.data() };
          
          const serviceLinesRef = collection(db, providersPath, provider.id, 'serviceLines');
          const serviceLinesSnap = await getDocs(serviceLinesRef);

          if (serviceLinesSnap.empty && provider.service) {
            const categoryKey = normalizeBudgetCategoryKey(provider.service);
            const assignedBudget = Number(provider.assignedBudget || provider.presupuestoAsignado || 0);

            if (assignedBudget > 0) {
              await addDoc(serviceLinesRef, {
                name: provider.service,
                categoryKey,
                assignedBudget,
                status: provider.status || 'Pendiente',
                notes: `Migrado automáticamente desde proveedor legacy`,
                deliverables: [],
                milestones: [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });

              migratedCount++;
              console.log(`[Migration] Migrated provider ${provider.name} (${provider.service})`);
            }
          }
        }

        if (migratedCount > 0) {
          console.log(`[Migration] Successfully migrated ${migratedCount} providers to serviceLines`);
        }
      } catch (error) {
        console.warn('[Migration] Error migrating providers:', error);
      }
    };

    const timer = setTimeout(migrateProviders, 2000);
    return () => clearTimeout(timer);
  }, [activeWedding, user]);

  return null;
}
