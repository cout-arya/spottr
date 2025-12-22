const axios = require('axios');

const runTest = async () => {
    console.log('--- STARTING BACKEND HEALTH CHECK ---');
    try {
        // 1. Try to Login
        console.log('1. Attempting Login...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'beast@example.com',
            password: 'password123'
        });

        if (loginRes.status === 200) {
            console.log('✅ Login SUCCESS');
            const token = loginRes.data.token;
            // console.log('Token:', token);

            // 2. Try to Fetch Recommendations
            console.log('\n2. Attempting Fetch Recommendations...');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const recRes = await axios.get('http://localhost:5000/api/matches/recommendations', config);

            if (recRes.status === 200) {
                console.log('✅ Fetch Recommendations SUCCESS');
                console.log(`Received ${recRes.data.length} candidates.`);
            } else {
                console.log(`❌ Fetch Recommendations FAILED with status: ${recRes.status}`);
            }

        } else {
            console.log('❌ Login FAILED with status:', loginRes.status);
        }

    } catch (error) {
        console.log('\n❌ TEST FAILED');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
    }
    console.log('--- END TEST ---');
};

runTest();
