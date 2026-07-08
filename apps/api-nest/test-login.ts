import axios from 'axios';

async function testLogin() {
  try {
    const res = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'juan.perez@student.edu',
      password: 'Admin123!'
    });
    console.log("Login successful:", res.data);
  } catch (err: any) {
    console.error("Login failed:", err.response?.data || err.message);
  }
}

testLogin();
