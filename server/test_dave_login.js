const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const API_URL = 'http://localhost:5000/api/auth/login';

const testLogin = async () => {
    try {
        console.log('Attempting login for Dave...');
        const res = await axios.post(API_URL, {
            email: 'dave@example.com',
            password: 'password123'
        });
        console.log('Login Successful:', res.status);
        console.log('User:', res.data.name);
    } catch (error) {
        console.error('Login Failed:', error.response ? error.response.status : error.message);
        if (error.response) console.error(error.response.data);
    }
};

testLogin();
