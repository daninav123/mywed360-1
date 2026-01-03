import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'malove_db',
  user: 'malove',
  password: 'malove_dev_password'
});

async function viewMyData() {
  try {
    const userId = '51fffb9f-564f-4ab2-a852-75f7337d9dd2';
    
    console.log('\n📊 TUS DATOS EN POSTGRESQL:\n');
    console.log('='.repeat(60));
    
    // Usuario
    const userResult = await pool.query(`
      SELECT id, email, role, "createdAt"
      FROM users 
      WHERE id = $1
    `, [userId]);
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log('\n👤 USUARIO:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Creado: ${user.createdAt}`);
    }
    
    // Perfil
    const profileResult = await pool.query(`
      SELECT *
      FROM user_profiles 
      WHERE "userId" = $1
    `, [userId]);
    
    if (profileResult.rows.length > 0) {
      const profile = profileResult.rows[0];
      console.log('\n📋 PERFIL:');
      console.log(`   Phone: ${profile.phone || 'No definido'}`);
      console.log(`   Email Planivia: ${profile.myWed360Email || 'No definido'}`);
      console.log(`   Bio: ${profile.bio || 'No definida'}`);
    }
    
    // Bodas
    const weddingsResult = await pool.query(`
      SELECT *
      FROM weddings 
      WHERE "userId" = $1
      ORDER BY "createdAt" DESC
    `, [userId]);
    
    console.log('\n💒 BODAS:');
    if (weddingsResult.rows.length === 0) {
      console.log('   ❌ No tienes bodas registradas');
    } else {
      weddingsResult.rows.forEach((w, i) => {
        console.log(`\n   ${i + 1}. ${w.coupleName}`);
        console.log(`      ID: ${w.id}`);
        console.log(`      Fecha: ${w.weddingDate}`);
        console.log(`      Lugar: ${w.celebrationPlace || 'No definido'}`);
        console.log(`      Estado: ${w.status}`);
        console.log(`      Invitados: ${w.numGuests || 0}`);
        console.log(`      Creada: ${w.createdAt}`);
      });
    }
    
    // Invitados
    const guestsResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM guests g
      INNER JOIN weddings w ON g."weddingId" = w.id
      WHERE w."userId" = $1
    `, [userId]);
    
    console.log(`\n👥 INVITADOS: ${guestsResult.rows[0].total} registrados`);
    
    // Checklist tabs
    const checklistResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM checklist_tabs ct
      INNER JOIN weddings w ON ct."weddingId" = w.id
      WHERE w."userId" = $1
    `, [userId]);
    
    console.log(`📝 CHECKLIST TABS: ${checklistResult.rows[0].total} registrados`);
    
    console.log('\n' + '='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

viewMyData();
