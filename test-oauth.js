const axios = require('axios');

async function run() {
  try {
    // 1. Initial request to backend proxy route
    const res = await axios.get('https://treeo.am/api/backend/auth/google', {
      maxRedirects: 0,
      validateStatus: null
    });
    console.log("Status:", res.status);
    console.log("Location:", res.headers.location);
  } catch (err) {
    console.error(err.message);
  }
}
run();
