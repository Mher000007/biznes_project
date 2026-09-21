const axios = require('axios');

async function test() {
  try {
    const email = `test${Date.now()}@example.com`;
    const password = 'Password123!';
    
    await axios.post('http://127.0.0.1:5001/api/auth/register', {
      name: 'Test User',
      email,
      password,
      role: 'customer'
    });

    const loginRes = await axios.post('http://127.0.0.1:5001/api/auth/login', {
      email,
      password
    });
    
    const token = loginRes.data.token;
    console.log("Got token:", token.substring(0, 20) + "...");
    
    try {
      const res = await axios.get('http://127.0.0.1:5001/api/bookings/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Direct backend GET /bookings/user returned:", res.status);
    } catch (e) {
      console.log("Direct backend GET /bookings/user error:", e.response ? e.response.status : e.message, e.response ? e.response.data : '');
    }

    try {
      const res = await axios.get('http://localhost:3000/api/backend/bookings/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Proxy GET /bookings/user returned:", res.status);
    } catch (e) {
      console.log("Proxy GET /bookings/user error:", e.response ? e.response.status : e.message, e.response ? e.response.data : '');
    }

  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
test();
