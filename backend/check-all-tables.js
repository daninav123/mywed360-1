import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'malove_db',
  user: 'malove',
  password: 'malove_dev_password'
});

async function checkAllTables() {
  try {
    console.log('🔍 Verificando todas las tablas en PostgreSQL...\n');
    
    // Obtener lista de todas las tablas
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log(`📋 Tablas encontradas: ${tablesResult.rows.length}\n`);
    
    for (const row of tablesResult.rows) {
      const tableName = row.table_name;
      
      // Contar registros en cada tabla
      const countResult = await pool.query(`SELECT COUNT(*) FROM "${tableName}"`);
      const count = parseInt(countResult.rows[0].count);
      
      const icon = count > 0 ? '✅' : '⚪';
      console.log(`${icon} ${tableName}: ${count} registros`);
    }
    
    console.log('\n📊 DETALLES DE TABLAS CON DATOS:\n');
    
    // Usuarios
    const usersResult = await pool.query('SELECT id, email, role, "createdAt" FROM users ORDER BY "createdAt" DESC LIMIT 5');
    if (usersResult.rows.length > 0) {
      console.log('👥 USUARIOS:');
      usersResult.rows.forEach((u, i) => {
        console.log(`  ${i + 1}. ${u.email} (${u.role}) - Creado: ${u.createdAt}`);
      });
      console.log('');
    }
    
    // Bodas
    const weddingsResult = await pool.query('SELECT id, "coupleName", "userId", "createdAt" FROM weddings ORDER BY "createdAt" DESC LIMIT 5');
    if (weddingsResult.rows.length > 0) {
      console.log('💒 BODAS:');
      weddingsResult.rows.forEach((w, i) => {
        console.log(`  ${i + 1}. ${w.coupleName || 'Sin nombre'} (User: ${w.userId}) - Creado: ${w.createdAt}`);
      });
      console.log('');
    } else {
      console.log('💒 BODAS: ❌ No hay bodas en la base de datos\n');
    }
    
    // Invitados
    const guestsResult = await pool.query('SELECT COUNT(*) as total FROM guests');
    console.log(`👤 INVITADOS: ${guestsResult.rows[0].total} registros\n`);
    
    // Proveedores
    const suppliersResult = await pool.query('SELECT COUNT(*) as total FROM suppliers');
    console.log(`🏢 PROVEEDORES: ${suppliersResult.rows[0].total} registros\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

checkAllTables();
