import sql from 'mssql';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

async function testFixedImport() {
    try {
        const config = {
            user: process.env.DB_USER || 'sa',
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER || process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 1433,
            database: process.env.DB_DATABASE || process.env.DB_NAME || 'master',
            options: {
                encrypt: false,
                trustServerCertificate: true,
                enableArithAbort: true,
            },
            requestTimeout: 300000, // 5 minutes
        };

        console.log('🔗 Connecting to database...');
        const pool = await sql.connect(config);
        console.log('✅ Connected to SQL Server successfully!');

        // Read the fixed SQL file
        console.log('📖 Reading data_import_statements_FIXED.sql...');
        const sqlContent = await fs.readFile('data_import_statements_FIXED.sql', 'utf8');

        // Extract the first INSERT statement for testing
        const lines = sqlContent.split('\n');
        let insertStatement = '';
        let inInsert = false;
        let firstInsertFound = false;

        for (const line of lines) {
            if (line.trim().startsWith('INSERT INTO') && !firstInsertFound) {
                inInsert = true;
                firstInsertFound = true;
                insertStatement = line;
                continue;
            }
            if (inInsert) {
                insertStatement += '\n' + line;
                // Look for the end of the first VALUES statement
                if (line.trim().endsWith('),') || line.trim().endsWith(');')) {
                    if (line.trim().endsWith('),')) {
                        // Replace ), with ); to make it a complete statement
                        insertStatement = insertStatement.replace(/\),\s*$/, ');');
                    }
                    break;
                }
            }
        }

        if (insertStatement) {
            console.log('🧪 Testing first INSERT statement...');
            console.log('Statement preview:');
            console.log(insertStatement.substring(0, 200) + '...');

            try {
                await pool.request().query(insertStatement);
                console.log('✅ Test INSERT successful!');

                // Check if data was inserted
                const rowCount = await pool.request().query('SELECT COUNT(*) as total_rows FROM data_team_active_items');
                console.log(`📊 Current rows in table: ${rowCount.recordset[0].total_rows}`);

                // Show sample of inserted data
                const sampleData = await pool.request().query('SELECT TOP 1 brand_name, item, description1 FROM data_team_active_items');
                if (sampleData.recordset.length > 0) {
                    console.log('📋 Sample inserted data:');
                    console.table(sampleData.recordset);
                }

                console.log('\n🎉 Column mapping is correct! Ready to insert all records.');
                return true;
            } catch (testError) {
                console.error('❌ Test INSERT failed:', testError.message);
                return false;
            }
        } else {
            console.error('❌ Could not extract test INSERT statement');
            return false;
        }

        await pool.close();
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

testFixedImport();