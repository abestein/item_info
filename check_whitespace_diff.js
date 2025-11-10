require('dotenv').config();
const { dbConfig, sql } = require('./config/database');

async function checkWhitespaceDiff() {
    try {
        const pool = await sql.connect(dbConfig);

        const query = `
            SELECT
                'Main Table' as source,
                item,
                description1,
                LEN(description1) as length,
                DATALENGTH(description1) as byte_length,
                CONVERT(VARBINARY(MAX), description1) as hex_value
            FROM data_team_active_items
            WHERE item = '3617BULK'

            UNION ALL

            SELECT
                'Temp Table' as source,
                item,
                description1,
                LEN(description1) as length,
                DATALENGTH(description1) as byte_length,
                CONVERT(VARBINARY(MAX), description1) as hex_value
            FROM data_team_active_items_temp
            WHERE item = '3617BULK'
        `;

        const result = await pool.query(query);

        console.log('\n=== Whitespace Difference Analysis for Item 3617BULK ===\n');

        result.recordset.forEach(row => {
            console.log(`Source: ${row.source}`);
            console.log(`Item: ${row.item}`);
            console.log(`Description: "${row.description1}"`);
            console.log(`String Length: ${row.length}`);
            console.log(`Byte Length: ${row.byte_length}`);
            console.log(`Hex Value: ${row.hex_value ? row.hex_value.toString('hex') : 'NULL'}`);

            let visibleChars = 'NULL';
            if (row.description1) {
                visibleChars = Array.from(row.description1).map(c => {
                    const code = c.charCodeAt(0);
                    if (code === 32) return '·'; // Show spaces as middle dots
                    if (code === 9) return '→'; // Show tabs as arrows
                    if (code === 10) return '↵'; // Show line feeds
                    if (code === 13) return '←'; // Show carriage returns
                    if (code < 32 || code === 160) return `[${code}]`; // Show control chars and nbsp
                    return c;
                }).join('');
            }
            console.log(`Visible Characters: [${visibleChars}]`);
            console.log('---\n');
        });

        await pool.close();

    } catch (error) {
        console.error('Error:', error);
    }
}

checkWhitespaceDiff();
