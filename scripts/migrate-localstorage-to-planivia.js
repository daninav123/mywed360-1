/**
 * Script de migración automática de localStorage
 * Migra datos de nombres antiguos (mywed360, lovenda, maloveapp) a planivia
 * 
 * Este script debe ejecutarse en el navegador al cargar la app
 */

export function migrateLocalStorageToPlanivia() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  const migrations = [
    // Guests
    { old: 'mywed360Guests', new: 'planivia_guests' },
    { old: 'maloveapp_guests', new: 'planivia_guests' },
    
    // Meetings/Tasks
    { old: 'mywed360Meetings', new: 'planivia_meetings' },
    { old: 'maloveapp_meetings', new: 'planivia_meetings' },
    { old: 'tasksCompleted', new: 'planivia_tasksCompleted' },
    
    // Suppliers
    { old: 'mywed360Suppliers', new: 'planivia_suppliers' },
    { old: 'maloveapp_suppliers', new: 'planivia_suppliers' },
    
    // Movements/Finance
    { old: 'mywed360Movements', new: 'planivia_movements' },
    { old: 'maloveapp_movements', new: 'planivia_movements' },
    
    // Profile
    { old: 'mywed360Profile', new: 'planivia_profile' },
    { old: 'maloveapp_profile', new: 'planivia_profile' },
    
    // Providers
    { old: 'lovendaProviders', new: 'planivia_providers' },
    { old: 'maloveapp_providers', new: 'planivia_providers' },
    
    // Notes
    { old: 'lovendaNotes', new: 'planivia_notes' },
    { old: 'maloveapp_notes', new: 'planivia_notes' },
    
    // Mails
    { old: 'malove_mails', new: 'planivia_mails' },
    { old: 'malove_email_templates', new: 'planivia_email_templates' },
    { old: 'malove_email_drafts', new: 'planivia_email_drafts' },
    
    // Progress
    { old: 'maloveapp_progress', new: 'planivia_progress' },
  ];

  let migratedCount = 0;
  
  migrations.forEach(({ old, new: newKey }) => {
    try {
      const oldValue = localStorage.getItem(old);
      const newValue = localStorage.getItem(newKey);
      
      // Solo migrar si existe el antiguo y NO existe el nuevo
      if (oldValue && !newValue) {
        localStorage.setItem(newKey, oldValue);
        migratedCount++;
        console.log(`✅ Migrado: ${old} → ${newKey}`);
      }
    } catch (error) {
      console.error(`❌ Error migrando ${old}:`, error);
    }
  });

  if (migratedCount > 0) {
    console.log(`🎉 Migración completada: ${migratedCount} elementos migrados a Planivia`);
  }

  return migratedCount;
}

// Auto-ejecutar en navegador
if (typeof window !== 'undefined') {
  // Ejecutar al cargar
  migrateLocalStorageToPlanivia();
}
