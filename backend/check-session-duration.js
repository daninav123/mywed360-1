import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;
const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'malove_db',
  user: 'malove',
  password: 'malove_dev_password'
});

async function checkSessionDuration() {
  try {
    console.log('📊 Analizando duración de sesiones...\n');
    
    // Última sesión
    const lastSession = await pool.query(`
      SELECT 
        "expiresAt", 
        "createdAt",
        EXTRACT(DAY FROM ("expiresAt" - "createdAt")) as dias_validez
      FROM sessions 
      ORDER BY "createdAt" DESC 
      LIMIT 1
    `);
    
    if (lastSession.rows.length > 0) {
      const s = lastSession.rows[0];
      console.log('🔍 Última sesión creada:');
      console.log(`   Creada: ${s.createdAt}`);
      console.log(`   Expira: ${s.expiresAt}`);
      console.log(`   Duración: ${Math.round(s.dias_validez)} días\n`);
    }
    
    // Promedio de duración
    const avgResult = await pool.query(`
      SELECT 
        AVG(EXTRACT(DAY FROM ("expiresAt" - "createdAt"))) as dias_promedio
      FROM sessions
    `);
    
    if (avgResult.rows.length > 0) {
      const avg = Math.round(avgResult.rows[0].dias_promedio);
      console.log(`📈 Duración promedio: ${avg} días\n`);
    }
    
    // Estadísticas generales
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE "expiresAt" < NOW()) as expiradas,
        COUNT(*) FILTER (WHERE "expiresAt" > NOW()) as validas
      FROM sessions
    `);
    
    const st = stats.rows[0];
    console.log('📊 Estadísticas:');
    console.log(`   Total: ${st.total}`);
    console.log(`   Válidas: ${st.validas}`);
    console.log(`   Expiradas: ${st.expiradas}\n`);
    
    // Recomendación
    if (lastSession.rows.length > 0) {
      const dias = Math.round(lastSession.rows[0].dias_validez);
      if (dias > 30) {
        console.log('⚠️  RECOMENDACIÓN:');
        console.log(`   Las sesiones duran ${dias} días. Es demasiado.`);
        console.log('   Recomendado: 7-30 días máximo');
        console.log('   Para cambiar: Modifica REFRESH_TOKEN_EXPIRATION en backend\n');
      } else {
        console.log(`✅ Duración de sesiones OK (${dias} días)\n`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSessionDuration();
