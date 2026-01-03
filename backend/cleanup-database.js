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

async function cleanupDatabase() {
  try {
    console.log('🧹 LIMPIANDO BASE DE DATOS (excepto blogs)...\n');
    console.log('⚠️  ADVERTENCIA: Esto eliminará TODOS los datos excepto blog_posts\n');
    
    // Obtener todas las tablas
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name != 'blog_posts'
      AND table_name != '_prisma_migrations'
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(r => r.table_name);
    
    console.log(`📋 Tablas a limpiar: ${tables.length}\n`);
    
    // Contar registros antes
    console.log('📊 Contando registros antes de limpiar...\n');
    const beforeCounts = {};
    for (const table of tables) {
      const countResult = await pool.query(`SELECT COUNT(*) FROM "${table}"`);
      beforeCounts[table] = parseInt(countResult.rows[0].count);
      if (beforeCounts[table] > 0) {
        console.log(`   ${table}: ${beforeCounts[table]} registros`);
      }
    }
    
    console.log('\n🗑️  Iniciando limpieza...\n');
    
    // Desactivar foreign key checks temporalmente
    await pool.query('SET session_replication_role = replica;');
    
    let cleaned = 0;
    let totalDeleted = 0;
    
    for (const table of tables) {
      try {
        const deleteResult = await pool.query(`DELETE FROM "${table}"`);
        const deleted = deleteResult.rowCount || 0;
        if (deleted > 0) {
          console.log(`   ✓ ${table}: ${deleted} registros eliminados`);
          cleaned++;
          totalDeleted += deleted;
        }
      } catch (error) {
        console.log(`   ✗ ${table}: Error - ${error.message}`);
      }
    }
    
    // Reactivar foreign key checks
    await pool.query('SET session_replication_role = DEFAULT;');
    
    console.log(`\n✅ Limpieza completada:`);
    console.log(`   - Tablas limpiadas: ${cleaned}/${tables.length}`);
    console.log(`   - Total registros eliminados: ${totalDeleted}\n`);
    
    // Verificar blogs se mantienen
    const blogsResult = await pool.query('SELECT COUNT(*) FROM blog_posts');
    const blogsCount = parseInt(blogsResult.rows[0].count);
    console.log(`📝 Blogs preservados: ${blogsCount}\n`);
    
    // Mostrar estado final
    console.log('📊 Estado final de la base de datos:\n');
    const finalResult = await pool.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE '%prisma%'
      ORDER BY table_name
    `);
    
    for (const row of finalResult.rows) {
      const countResult = await pool.query(`SELECT COUNT(*) FROM "${row.table_name}"`);
      const count = parseInt(countResult.rows[0].count);
      const icon = count > 0 ? '✅' : '⚪';
      console.log(`   ${icon} ${row.table_name}: ${count} registros`);
    }
    
    console.log('\n🎯 Base de datos lista para pruebas con PostgreSQL\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

cleanupDatabase();
