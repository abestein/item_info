const bcrypt = require('bcryptjs');

async function testPassword() {
    const password = 'RabeS*4835';
    const storedHash = '$2a$10$ZKxVqVJfWKxWZHpV9XN.8ORsGdBLFzqGQxKpBFLzPwV8vLKXBhnjW';

    // Test if the password matches the hash
    const isMatch = await bcrypt.compare(password, storedHash);
    console.log('Password matches stored hash:', isMatch);

    // Generate a new hash for this password
    const newHash = await bcrypt.hash(password, 10);
    console.log('\nNew hash for this password:');
    console.log(newHash);
    console.log('\nSQL to update:');
    console.log(`UPDATE Users SET PasswordHash = '${newHash}' WHERE Username = 'admin';`);
}

testPassword();