const axios = require('axios');

const runTest = async () => {
    console.log('--- TESTING SEARCH API ---');
    try {
        // Login
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'beast@example.com',
            password: 'password123'
        });
        const token = loginRes.data.token;

        // Search
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const searchRes = await axios.get('http://localhost:5000/api/users/search?q=a', config);

        if (searchRes.status === 200) {
            const users = searchRes.data;
            if (users.length > 0) {
                const firstUser = users[0];
                console.log(`First User: ${firstUser.name}`);
                if (firstUser.matchPercentage !== undefined) {
                    console.log(`✅ matchPercentage found: ${firstUser.matchPercentage}`);
                } else {
                    console.log('❌ matchPercentage MISSING');
                }
            } else {
                console.log('⚠️ No users found for query "a"');
            }
        }
    } catch (error) {
        console.error('Test Failed:', error.message);
    }
};

runTest();
