/**
 * Database Query Template
 *
 * This is a reusable template for direct SQL Server database queries.
 * Copy this file and modify the query to suit your needs.
 *
 * WHY USE THIS APPROACH:
 * - No API keys needed
 * - Simple and reliable
 * - Uses existing .env credentials
 * - Fast execution
 *
 * USAGE:
 * 1. Copy this file to a new name (e.g., get_my_data.mjs)
 * 2. Modify the executeQuery() function with your SQL query
 * 3. Run: node get_my_data.mjs
 */

import sql from 'mssql';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Database configuration from .env
const dbConfig = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD?.replace(/"/g, ''),
    port: parseInt(process.env.DB_PORT),
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

/**
 * Main query execution function
 * Modify this function with your specific query
 */
async function executeQuery() {
    try {
        // Connect to database
        await sql.connect(dbConfig);
        console.log('✓ Connected to SQL Server');

        // EXAMPLE 1: Get stored procedure definition
        // Uncomment and modify as needed
        /*
        const spResult = await sql.query`
            SELECT OBJECT_DEFINITION(OBJECT_ID('sp_YourStoredProcedure'))
            AS ProcedureDefinition
        `;
        console.log('\n=== Stored Procedure Definition ===');
        console.log(spResult.recordset[0].ProcedureDefinition);
        */

        // EXAMPLE 2: Get table structure
        // Uncomment and modify as needed
        /*
        const tableResult = await sql.query`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'YourTableName'
            ORDER BY ORDINAL_POSITION
        `;
        console.log('\n=== Table Structure ===');
        console.table(tableResult.recordset);
        */

        // EXAMPLE 3: Get data from table
        // Uncomment and modify as needed
        /*
        const dataResult = await sql.query`
            SELECT TOP 10 * FROM YourTableName
        `;
        console.log('\n=== Sample Data ===');
        console.table(dataResult.recordset);
        */

        // EXAMPLE 4: Execute stored procedure
        // Uncomment and modify as needed
        /*
        const request = new sql.Request();
        request.input('param1', sql.VarChar, 'value1');
        const procResult = await request.execute('sp_YourProcedure');
        console.log('\n=== Procedure Results ===');
        console.table(procResult.recordset);
        */

        // EXAMPLE 5: Parameterized query
        // Uncomment and modify as needed
        /*
        const request = new sql.Request();
        request.input('itemCode', sql.VarChar, 'ITEM123');
        const paramResult = await request.query(`
            SELECT * FROM data_team_active_items
            WHERE item = @itemCode
        `);
        console.log('\n=== Query Results ===');
        console.table(paramResult.recordset);
        */

        // YOUR CUSTOM QUERY HERE:
        // Replace this with your actual query
        console.log('\n⚠️  Please modify this template with your specific query');

        // Close connection
        await sql.close();
        console.log('\n✓ Connection closed');

    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

// Run the query
executeQuery();
