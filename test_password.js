const bcrypt = require('bcryptjs');

async function testPassword() {
    const password = 'Admin123!';
    const storedHash = '$2b$10$I/V6lGcxl0EQTq5opqz9Ie/9DTwVbmwSXIz9Hr/xDtutkdnxzG20O';

    console.log('Testing password:', password);
    console.log('Against hash:', storedHash);

    const isValid = await bcrypt.compare(password, storedHash);
    console.log('Password valid:', isValid);

    // Test with bcrypt hash generation
    const newHash = await bcrypt.hash(password, 10);
    console.log('New hash:', newHash);
    const testNew = await bcrypt.compare(password, newHash);
    console.log('New hash valid:', testNew);
}

testPassword().catch(console.error);