import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'malove_db',
  user: 'malove',
  password: 'malove_dev_password'
});

async function createTestWedding() {
  try {
    console.log('🎊 Creando boda de prueba...\n');
    
    // Tu usuario
    const userId = '51fffb9f-564f-4ab2-a852-75f7337d9dd2'; // danielnavarrocampos@icloud.com
    
    // Crear boda
    const result = await pool.query(`
      INSERT INTO weddings (
        id,
        "userId",
        "coupleName",
        "weddingDate",
        "celebrationPlace",
        status,
        "numGuests",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        gen_random_uuid(),
        $1,
        'Dani & Partner',
        '2026-06-15',
        'Barcelona',
        'planning',
        100,
        NOW(),
        NOW()
      )
      RETURNING *
    `, [userId]);
    
    const wedding = result.rows[0];
    
    console.log('✅ Boda creada exitosamente:\n');
    console.log(`   ID: ${wedding.id}`);
    console.log(`   Pareja: ${wedding.coupleName}`);
    console.log(`   Fecha: ${wedding.weddingDate}`);
    console.log(`   Lugar: ${wedding.celebrationPlace}`);
    console.log(`   Invitados: ${wedding.numGuests}\n`);
    
    console.log('🎉 ¡Listo! Recarga la página y ya verás la boda\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

createTestWedding();
