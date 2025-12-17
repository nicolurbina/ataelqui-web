

// Native fetch is available in recent Node versions

async function testConnection() {
    try {
        console.log('Testing connection to http://localhost:5000/api/users...');
        const response = await fetch('http://localhost:5000/api/users');
        if (response.ok) {
            const data = await response.json();
            console.log('Success! API is reachable.');
            console.log('User count:', data.data ? data.data.length : 0);
            if (data.data) {
                console.log('Users:', JSON.stringify(data.data, null, 2));
            }
        } else {
            console.log('Failed Status:', response.status);
            const text = await response.text();
            console.log('Response:', text);
        }
    } catch (error) {
        console.error('Connection failed:', error.message);
    }
}

testConnection();
