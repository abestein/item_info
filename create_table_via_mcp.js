const sql = require('mssql');
require('dotenv').config();

async function createTableViaMCP() {
    try {
        // Database configuration from .env
        const dbConfig = {
            server: process.env.DB_SERVER,
            database: process.env.DB_DATABASE,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD.replace(/"/g, ''), // Remove quotes
            port: parseInt(process.env.DB_PORT),
            options: {
                encrypt: false,
                trustServerCertificate: true,
                enableArithAbort: true,
                connectTimeout: 10000,
                requestTimeout: 30000
            }
        };

        console.log(`Connecting to SQL Server: ${dbConfig.server}:${dbConfig.port}`);
        console.log(`Database: ${dbConfig.database}`);
        console.log(`User: ${dbConfig.user}`);

        // Connect to database
        await sql.connect(dbConfig);
        console.log('✅ Connected to SQL Server successfully');

        // Check if table already exists
        const checkTableQuery = `
            SELECT COUNT(*) as table_count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'data_team_active_items'
        `;

        const checkResult = await sql.query(checkTableQuery);
        const tableExists = checkResult.recordset[0].table_count > 0;

        if (tableExists) {
            console.log('⚠️  Table "data_team_active_items" already exists');
            console.log('Would you like to drop and recreate it? (This will delete all data)');
            
            // For now, let's just show the table info
            const tableInfoQuery = `
                SELECT 
                    COLUMN_NAME,
                    DATA_TYPE,
                    CHARACTER_MAXIMUM_LENGTH,
                    IS_NULLABLE
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'data_team_active_items'
                ORDER BY ORDINAL_POSITION
            `;
            
            const tableInfo = await sql.query(tableInfoQuery);
            console.log('\n📋 Current table structure:');
            tableInfo.recordset.forEach((col, index) => {
                console.log(`${(index + 1).toString().padStart(2)}: ${col.COLUMN_NAME.padEnd(25)} | ${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''} | ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
            });
            
            return;
        }

        // Read the CREATE TABLE statement from file
        const fs = require('fs');
        const createTableSQL = fs.readFileSync('create_table_script.sql', 'utf8');

        console.log('\n🚀 Creating table "data_team_active_items"...');
        console.log('\nExecuting SQL:');
        console.log('=====================================');
        console.log(createTableSQL);
        console.log('=====================================\n');

        // Execute the CREATE TABLE statement
        await sql.query(createTableSQL);

        console.log('✅ Table "data_team_active_items" created successfully!');

        // Verify the table was created
        const verifyQuery = `
            SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                CHARACTER_MAXIMUM_LENGTH,
                IS_NULLABLE,
                COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'data_team_active_items'
            ORDER BY ORDINAL_POSITION
        `;

        const verifyResult = await sql.query(verifyQuery);
        
        console.log(`\n📊 Table created with ${verifyResult.recordset.length} columns:`);
        verifyResult.recordset.forEach((col, index) => {
            const defaultVal = col.COLUMN_DEFAULT ? ` | Default: ${col.COLUMN_DEFAULT}` : '';
            console.log(`${(index + 1).toString().padStart(2)}: ${col.COLUMN_NAME.padEnd(25)} | ${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''} | ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}${defaultVal}`);
        });

        // Check table is empty
        const countQuery = `SELECT COUNT(*) as row_count FROM data_team_active_items`;
        const countResult = await sql.query(countQuery);
        console.log(`\n📈 Table row count: ${countResult.recordset[0].row_count}`);

        console.log('\n🎉 Table creation completed successfully!');
        console.log('Next steps:');
        console.log('  1. Use the CSV file for bulk import');
        console.log('  2. Or run the INSERT statements from data_import_statements.sql');
        console.log('  3. Verify with data_validation_queries.sql');

    } catch (error) {
        console.error('❌ Error creating table:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        // Close connection
        try {
            await sql.close();
            console.log('🔌 Database connection closed');
        } catch (closeError) {
            console.error('Error closing connection:', closeError.message);
        }
    }
}

createTableViaMCP();