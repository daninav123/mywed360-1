import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'malove_db',
  user: 'malove',
  password: 'malove_dev_password'
});

async function verifyDB() {
  try {
    console.log('🔍 Conectando a PostgreSQL...\n');
    
    // Count weddings
    const countResult = await pool.query('SELECT COUNT(*) FROM weddings');
    console.log(`📊 Total bodas: ${countResult.rows[0].count}\n`);
    
    // Get all weddings
    const weddingsResult = await pool.query(`
      SELECT id, "coupleName", "weddingDate", "userId", "createdAt"
      FROM weddings
      ORDER BY "createdAt" DESC
      LIMIT 20
    `);
    
    if (weddingsResult.rows.length > 0) {
      console.log('✅ Bodas encontradas:\n');
      weddingsResult.rows.forEach((w, i) => {
        console.log(`${i + 1}. ${w.coupleName || 'Sin nombre'}`);
        console.log(`   ID: ${w.id}`);
        console.log(`   User ID: ${w.userId}`);
        console.log(`   Fecha: ${w.weddingDate}`);
        console.log(`   Creada: ${w.createdAt}`);
        console.log('');
      });
    } else {
      console.log('❌ No se encontraron bodas en la base de datos\n');
    }
    
    // Check users
    const usersResult = await pool.query('SELECT id, email, role FROM users LIMIT 5');
    console.log(`👥 Usuarios encontrados: ${usersResult.rows.length}\n`);
    usersResult.rows.forEach((u, i) => {
      console.log(`${i + 1}. ${u.email} (${u.role})`);
      console.log(`   ID: ${u.id}\n`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifyDB();
