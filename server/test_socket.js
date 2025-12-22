const io = require('socket.io-client');
const axios = require('axios');

const runTest = async () => {
    try {
        // 1. Login Actor
        const actorRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'beast@example.com',
            password: 'password123'
        });
        const actor = actorRes.data;
        console.log(`Actor Authenticated: ${actor.name}`);

        // 2. Login Target
        const targetRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'nancy@example.com',
            password: 'password123'
        });
        const target = targetRes.data;
        console.log(`Target Authenticated: ${target.name}`);

        // 3. Connect Target Socket
        const socket = io('http://localhost:5000');
        socket.emit('setup', target);
        console.log('Target Socket Connected');

        // Listen for event
        let eventReceived = false;
        socket.on('like received', (data) => {
            console.log('\n✅ SUCCESS: Like Notification Received!');
            console.log(`Admirer: ${data.admirerName}`);
            eventReceived = true;
            socket.disconnect();
            process.exit(0);
        });

        // 4. Trigger Swipe (Actor likes Target)
        console.log('Triggering Swipe...');
        const config = { headers: { Authorization: `Bearer ${actor.token}` } };
        await axios.post('http://localhost:5000/api/matches/swipe', {
            targetId: target._id,
            type: 'like'
        }, config);
        console.log('Swipe API Called.');

        // Timeout
        setTimeout(() => {
            if (!eventReceived) {
                console.log('\n❌ FAILED: Timeout waiting for event.');
                process.exit(1);
            }
        }, 5000);

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
};

runTest();
