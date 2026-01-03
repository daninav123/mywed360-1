import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'malove_db',
  user: 'malove',
  password: 'malove_dev_password'
});

async function cleanupTestUsers() {
  try {
    console.log('🧹 Limpiando usuarios de prueba...\n');
    
    const keepEmail = 'danielnavarrocampos@icloud.com';
    
    // Obtener ID del usuario a mantener
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [keepEmail]
    );
    
    if (userResult.rows.length === 0) {
      console.log(`❌ Usuario ${keepEmail} no encontrado`);
      return;
    }
    
    const keepUserId = userResult.rows[0].id;
    console.log(`✅ Manteniendo usuario: ${keepEmail} (ID: ${keepUserId})\n`);
    
    // Eliminar usuarios de prueba (excepto el que queremos mantener)
    const deleteResult = await pool.query(`
      DELETE FROM users 
      WHERE id != $1
      RETURNING email
    `, [keepUserId]);
    
    console.log(`🗑️  Eliminados ${deleteResult.rows.length} usuarios de prueba:\n`);
    deleteResult.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.email}`);
    });
    
    // Mostrar usuarios restantes
    const remainingResult = await pool.query('SELECT email, role FROM users');
    console.log(`\n✅ Usuarios restantes: ${remainingResult.rows.length}\n`);
    remainingResult.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.email} (${row.role})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

cleanupTestUsers();
