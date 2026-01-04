import axios from 'axios';

const API_URL = 'http://localhost:4004';

async function testSuppliersEndpoint() {
  try {
    // 1. Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'danielnavarrocampos@icloud.com',
      password: 'TestPass123!',
    });

    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    console.log('✅ Login successful, user:', user.email);

    // 2. Get user's wedding
    console.log('\n2. Getting user weddings...');
    const weddingsResponse = await axios.get(`${API_URL}/api/user/weddings`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const weddings = weddingsResponse.data.data;
    console.log(`✅ Found ${weddings.length} wedding(s)`);

    if (weddings.length === 0) {
      console.log('❌ No weddings found for testing');
      return;
    }

    const weddingId = weddings[0].id;
    console.log('   Wedding ID:', weddingId);
    console.log('   Couple:', weddings[0].coupleName);

    // 3. Test GET suppliers endpoint
    console.log('\n3. Getting suppliers for wedding...');
    const suppliersResponse = await axios.get(
      `${API_URL}/api/wedding-suppliers/wedding/${weddingId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Suppliers endpoint works!');
    console.log('   Status:', suppliersResponse.status);
    console.log('   Suppliers count:', suppliersResponse.data.data.length);

    if (suppliersResponse.data.data.length > 0) {
      console.log('   Sample supplier:', suppliersResponse.data.data[0].name);
    }

    // 4. Test POST - Create a test supplier
    console.log('\n4. Creating test supplier...');
    const newSupplier = await axios.post(
      `${API_URL}/api/wedding-suppliers/wedding/${weddingId}`,
      {
        name: 'Proveedor de Prueba',
        service: 'Catering',
        contact: 'Juan Pérez',
        email: 'juan@test.com',
        phone: '+34 600 000 000',
        status: 'Nuevo',
        budget: 5000,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Supplier created successfully!');
    console.log('   ID:', newSupplier.data.data.id);
    console.log('   Name:', newSupplier.data.data.name);

    const supplierId = newSupplier.data.data.id;

    // 5. Test PUT - Update supplier
    console.log('\n5. Updating supplier...');
    await axios.put(
      `${API_URL}/api/wedding-suppliers/${supplierId}`,
      { status: 'Contactado', favorite: true },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Supplier updated successfully!');

    // 6. Test service line creation
    console.log('\n6. Creating service line...');
    const serviceLine = await axios.post(
      `${API_URL}/api/wedding-suppliers/${supplierId}/service-lines`,
      {
        name: 'Menú degustación',
        assignedBudget: 3000,
        status: 'Pendiente',
        notes: 'Para 50 personas',
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Service line created!');
    console.log('   ID:', serviceLine.data.data.id);

    // 7. Test DELETE
    console.log('\n7. Deleting test supplier...');
    await axios.delete(`${API_URL}/api/wedding-suppliers/${supplierId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('✅ Supplier deleted successfully!');

    console.log('\n✅✅✅ ALL TESTS PASSED! ✅✅✅');
    console.log('\nSuppliers API is working correctly with PostgreSQL!\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', error.response.data);
    }
    process.exit(1);
  }
}

testSuppliersEndpoint();
