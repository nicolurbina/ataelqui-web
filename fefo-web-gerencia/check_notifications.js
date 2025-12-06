// const fetch = require('node-fetch');

async function checkCollections() {
    const baseUrl = 'http://localhost:3000/api/debug';
    try {
        const res = await fetch(baseUrl);
        const data = await res.json();
        console.log('--- COUNTS ---');
        for (const [key, value] of Object.entries(data.data)) {
            console.log(`${key}: ${value}`);
        }
        console.log('--------------');
    } catch (e) {
        console.error('Error:', e);
    }
}

checkCollections();
