/**
 * autoAssignGuests - Auto-asignación inteligente de invitados a mesas
 * Distribuye invitados automáticamente cuando se aplica un template
 */

/**
 * Asigna automáticamente todos los invitados a las mesas generadas
 * 
 * @param {Array} tables - Mesas generadas por el template
 * @param {Array} guests - Lista completa de invitados
 * @returns {Object} { assignedGuests, updatedTables }
 */
export function autoAssignGuestsToTables(tables, guests) {
  if (!tables || tables.length === 0 || !guests || guests.length === 0) {
    return { assignedGuests: guests, updatedTables: tables };
  }

  // 1. Preparar datos
  const unassignedGuests = guests.filter(g => !g.tableId && !g.table);
  const tablesWithCapacity = tables.map(t => ({
    ...t,
    remainingCapacity: t.seats || 8,
    assignedGuests: [],
  }));

  // 2. Agrupar invitados por familias/grupos
  const guestGroups = groupGuestsByFamily(unassignedGuests);

  // 3. Ordenar grupos por tamaño (más grandes primero)
  const sortedGroups = guestGroups.sort((a, b) => b.totalPeople - a.totalPeople);

  // 4. Asignar grupos a mesas
  const assignments = [];
  
  for (const group of sortedGroups) {
    // Buscar mesa con capacidad suficiente
    const suitableTable = findBestTableForGroup(group, tablesWithCapacity);
    
    if (suitableTable) {
      // Asignar todo el grupo a esta mesa
      for (const guest of group.guests) {
        assignments.push({
          guestId: guest.id,
          tableId: suitableTable.id,
          tableName: suitableTable.name,
        });
        
        suitableTable.assignedGuests.push(guest.id);
        suitableTable.remainingCapacity -= (1 + (parseInt(guest.companion, 10) || 0));
      }
    } else {
      // Si no hay mesa con capacidad, dividir grupo
      for (const guest of group.guests) {
        const tableForGuest = findBestTableForGuest(guest, tablesWithCapacity);
        if (tableForGuest) {
          assignments.push({
            guestId: guest.id,
            tableId: tableForGuest.id,
            tableName: tableForGuest.name,
          });
          
          tableForGuest.assignedGuests.push(guest.id);
          tableForGuest.remainingCapacity -= (1 + (parseInt(guest.companion, 10) || 0));
        }
      }
    }
  }

  // 5. Aplicar asignaciones a los invitados
  const assignedGuests = guests.map(guest => {
    const assignment = assignments.find(a => a.guestId === guest.id);
    if (assignment) {
      return {
        ...guest,
        tableId: assignment.tableId,
        table: assignment.tableId, // Legacy
        tableName: assignment.tableName,
      };
    }
    return guest;
  });

  // 6. Actualizar mesas con ocupación
  const updatedTables = tables.map(table => {
    const tableData = tablesWithCapacity.find(t => t.id === table.id);
    if (tableData) {
      return {
        ...table,
        occupancy: tableData.assignedGuests.length,
        assignedGuestIds: tableData.assignedGuests,
      };
    }
    return table;
  });

  return {
    assignedGuests,
    updatedTables,
    stats: {
      totalGuests: guests.length,
      assigned: assignments.length,
      unassigned: guests.length - assignments.length,
      tables: tables.length,
      groups: guestGroups.length,
    },
  };
}

/**
 * Agrupa invitados por familia/apellido
 */
function groupGuestsByFamily(guests) {
  const groups = {};
  
  for (const guest of guests) {
    // Intentar agrupar por apellido
    const lastName = extractLastName(guest.name);
    
    if (!groups[lastName]) {
      groups[lastName] = {
        name: lastName,
        guests: [],
        totalPeople: 0,
      };
    }
    
    groups[lastName].guests.push(guest);
    groups[lastName].totalPeople += (1 + (parseInt(guest.companion, 10) || 0));
  }
  
  return Object.values(groups);
}

/**
 * Extrae el apellido del nombre completo
 */
function extractLastName(fullName) {
  if (!fullName) return 'Sin Apellido';
  
  const parts = fullName.trim().split(' ');
  
  // Si tiene más de una palabra, el apellido es la última
  if (parts.length > 1) {
    return parts[parts.length - 1];
  }
  
  // Si solo tiene un nombre, usar ese
  return parts[0];
}

/**
 * Encuentra la mejor mesa para un grupo
 */
function findBestTableForGroup(group, tables) {
  // Buscar mesas con capacidad suficiente
  const suitableTables = tables.filter(t => t.remainingCapacity >= group.totalPeople);
  
  if (suitableTables.length === 0) {
    return null;
  }
  
  // Preferir mesa con capacidad más ajustada (evitar desperdiciar espacio)
  suitableTables.sort((a, b) => a.remainingCapacity - b.remainingCapacity);
  
  return suitableTables[0];
}

/**
 * Encuentra la mejor mesa para un invitado individual
 */
function findBestTableForGuest(guest, tables) {
  const guestSize = 1 + (parseInt(guest.companion, 10) || 0);
  
  // Buscar mesas con capacidad
  const suitableTables = tables.filter(t => t.remainingCapacity >= guestSize);
  
  if (suitableTables.length === 0) {
    return null;
  }
  
  // Preferir mesas que ya tienen asignados (para no dejar mesas medio vacías)
  const tablesWithGuests = suitableTables.filter(t => t.assignedGuests.length > 0);
  
  if (tablesWithGuests.length > 0) {
    // Mesa más llena (pero con espacio)
    tablesWithGuests.sort((a, b) => b.assignedGuests.length - a.assignedGuests.length);
    return tablesWithGuests[0];
  }
  
  // Si todas están vacías, usar la primera
  return suitableTables[0];
}

/**
 * Versión simplificada: solo distribuir uniformemente
 */
export function simpleAutoAssign(tables, guests) {
  if (!tables || tables.length === 0 || !guests || guests.length === 0) {
    return { assignedGuests: guests, updatedTables: tables };
  }

  const unassignedGuests = guests.filter(g => !g.tableId && !g.table);
  const assignments = [];
  
  let currentTableIndex = 0;
  
  for (const guest of unassignedGuests) {
    const table = tables[currentTableIndex];
    
    assignments.push({
      guestId: guest.id,
      tableId: table.id,
      tableName: table.name,
    });
    
    // Rotar a siguiente mesa
    currentTableIndex = (currentTableIndex + 1) % tables.length;
  }

  const assignedGuests = guests.map(guest => {
    const assignment = assignments.find(a => a.guestId === guest.id);
    if (assignment) {
      return {
        ...guest,
        tableId: assignment.tableId,
        table: assignment.tableId,
        tableName: assignment.tableName,
      };
    }
    return guest;
  });

  return { assignedGuests, updatedTables: tables };
}

/**
 * Calcula estadísticas de la asignación
 */
export function calculateAssignmentStats(guests, tables) {
  const assigned = guests.filter(g => g.tableId || g.table).length;
  const unassigned = guests.length - assigned;
  
  const tableOccupancy = tables.map(table => {
    const guestsInTable = guests.filter(g => 
      String(g.tableId) === String(table.id) || String(g.table) === String(table.id)
    );
    
    const totalPeople = guestsInTable.reduce((sum, g) => {
      return sum + 1 + (parseInt(g.companion, 10) || 0);
    }, 0);
    
    return {
      tableId: table.id,
      tableName: table.name,
      capacity: table.seats || 8,
      occupied: totalPeople,
      remaining: (table.seats || 8) - totalPeople,
      utilizationPercent: Math.round((totalPeople / (table.seats || 8)) * 100),
    };
  });
  
  const avgUtilization = tableOccupancy.length > 0
    ? Math.round(tableOccupancy.reduce((sum, t) => sum + t.utilizationPercent, 0) / tableOccupancy.length)
    : 0;
  
  return {
    totalGuests: guests.length,
    assigned,
    unassigned,
    totalTables: tables.length,
    avgUtilization,
    tableOccupancy,
    isComplete: unassigned === 0,
  };
}
