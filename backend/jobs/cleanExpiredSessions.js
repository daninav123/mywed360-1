import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function cleanExpiredSessions() {
  try {
    console.log('🧹 Limpiando sesiones expiradas...\n');
    
    // Contar sesiones antes
    const beforeResult = await pool.query('SELECT COUNT(*) FROM sessions');
    const before = parseInt(beforeResult.rows[0].count);
    console.log(`📊 Sesiones antes: ${before}`);
    
    // Eliminar sesiones expiradas
    const deleteResult = await pool.query(`
      DELETE FROM sessions 
      WHERE "expiresAt" < NOW()
      RETURNING id
    `);
    
    const deleted = deleteResult.rows.length;
    console.log(`🗑️  Sesiones expiradas eliminadas: ${deleted}`);
    
    // Contar sesiones después
    const afterResult = await pool.query('SELECT COUNT(*) FROM sessions');
    const after = parseInt(afterResult.rows[0].count);
    console.log(`📊 Sesiones restantes: ${after}\n`);
    
    // Mostrar sesiones más antiguas que 30 días (advertencia)
    const oldResult = await pool.query(`
      SELECT COUNT(*) 
      FROM sessions 
      WHERE "createdAt" < NOW() - INTERVAL '30 days'
      AND "expiresAt" > NOW()
    `);
    const old = parseInt(oldResult.rows[0].count);
    
    if (old > 0) {
      console.log(`⚠️  ${old} sesiones tienen más de 30 días (considera reducir expiresAt)`);
    }
    
    console.log('✅ Limpieza completada\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanExpiredSessions();
}

export default cleanExpiredSessions;
