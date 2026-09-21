require('dotenv').config();
const jwt = require('jsonwebtoken');
const axios = require('axios');

async function test() {
  const fakeUserId = "609c13d80000000000000000";
  const token = jwt.sign(
    { id: fakeUserId, role: 'customer', verified: true },
    process.env.JWT_SECRET || 'armbiz_dev_secret_key_2026',
    { expiresIn: '1d' }
  );
  
  try {
    const res = await axios.get('http://127.0.0.1:5001/api/bookings/user', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Success:", res.data);
  } catch (e) {
    console.log("Error status:", e.response ? e.response.status : e.message);
    console.log("Error data:", e.response ? e.response.data : '');
  }
}
test();
