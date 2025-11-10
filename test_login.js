const axios = require('axios');

async function testLogin() {
    try {
        const response = await axios.post('http://localhost:3000/api/auth/login', {
            username: 'admin',
            password: 'Admin123!'
        });

        console.log('Success:', response.data);
    } catch (error) {
        console.log('Error:', error.response?.data || error.message);
    }
}

testLogin();