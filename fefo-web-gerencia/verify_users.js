// const fetch = require('node-fetch'); // Using native fetch

async function testUserApi() {
    const baseUrl = 'http://localhost:3000/api/users';

    console.log('--- Testing User API ---');

    // 1. Create User
    console.log('\n1. Creating User...');
    const newUser = {
        name: 'Test User',
        email: 'test@example.com',
        role: 'Bodeguero',
        status: 'Activo'
    };

    let createdUserId;

    try {
        const createRes = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
        });
        const createData = await createRes.json();
        console.log('Create Response:', createData);

        if (createData.success) {
            createdUserId = createData.data.id;
            console.log('User Created with ID:', createdUserId);
        } else {
            console.error('Failed to create user');
            return;
        }
    } catch (e) {
        console.error('Error creating user:', e);
        return;
    }

    // 2. Get Users
    console.log('\n2. Fetching Users...');
    try {
        const getRes = await fetch(baseUrl);
        const getData = await getRes.json();
        console.log('Get Response Success:', getData.success);
        console.log('User count:', getData.data.length);

        const found = getData.data.find(u => u.id === createdUserId);
        if (found) {
            console.log('Created user found in list.');
        } else {
            console.error('Created user NOT found in list.');
        }
    } catch (e) {
        console.error('Error fetching users:', e);
    }

    // 3. Delete User
    if (createdUserId) {
        console.log(`\n3. Deleting User ${createdUserId}...`);
        try {
            const deleteRes = await fetch(`${baseUrl}/${createdUserId}`, {
                method: 'DELETE'
            });
            const deleteData = await deleteRes.json();
            console.log('Delete Response:', deleteData);
        } catch (e) {
            console.error('Error deleting user:', e);
        }
    }
}

testUserApi();
