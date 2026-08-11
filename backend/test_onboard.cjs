const jwt = require('jsonwebtoken');
const axios = require('axios');

const token = jwt.sign({ id: '650a2b5b4f1a2c001c8e4a99', role: 'business_owner', verified: true }, 'armbiz_dev_secret_key_2026');

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/businesses/onboard', {
      name: "Test Business",
      description: "Test Description",
      category: "hotel",
      email: "test@example.com",
      phone: "+374 123456",
      address: "Test Address",
      city: "Yerevan",
      country: "Armenia"
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Error:", err.response?.status, err.response?.data);
  }
}
test();
