import sql from 'mssql';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function executeFieldSizeIncrease() {
    let pool;
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
        };

        console.log('🔗 Connecting to SQL Server...');
        console.log('Connection details:', {
            server: config.server,
            database: config.database,
            user: config.user
        });

        pool = await sql.connect(config);
        console.log('✅ Connected to SQL Server successfully!');

        // Read the SQL script
        const scriptPath = path.join(process.cwd(), 'increase_field_sizes.sql');
        console.log(`📄 Reading script from: ${scriptPath}`);

        if (!fs.existsSync(scriptPath)) {
            throw new Error(`Script file not found: ${scriptPath}`);
        }

        const sqlScript = fs.readFileSync(scriptPath, 'utf8');
        console.log('📋 Script loaded successfully');

        // Split the script into individual statements
        // Remove the USE statement and GO commands as we're already connected to the right database
        const statements = sqlScript
            .split(/\bGO\b/gi)
            .map(stmt => stmt.trim())
            .filter(stmt => stmt && !stmt.match(/^USE\s+/i))
            .filter(stmt => stmt !== '');

        console.log(`🔧 Executing ${statements.length} SQL statements...`);
        console.log('');

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];

            // Skip PRINT statements for cleaner output
            if (statement.match(/^PRINT\s+/i)) {
                const message = statement.replace(/^PRINT\s+/i, '').replace(/'/g, '');
                console.log(`📢 ${message}`);
                continue;
            }

            try {
                console.log(`⚙️  Executing statement ${i + 1}...`);
                const result = await pool.request().query(statement);

                // If it's a SELECT statement, show results
                if (statement.trim().toUpperCase().startsWith('SELECT')) {
                    console.log('📊 Query results:');
                    console.table(result.recordset);
                } else {
                    console.log(`✅ Statement ${i + 1} executed successfully`);
                }
            } catch (error) {
                console.error(`❌ Error executing statement ${i + 1}:`, error.message);
                console.error('Statement:', statement);
                // Continue with other statements
            }
            console.log('');
        }

        console.log('🎉 Field size increase script execution completed!');

        // Final verification - get current column sizes
        console.log('🔍 Verifying final column sizes...');
        const verificationQuery = `
            SELECT
                COLUMN_NAME,
                DATA_TYPE,
                CHARACTER_MAXIMUM_LENGTH,
                CASE
                    WHEN COLUMN_NAME IN ('description1', 'description3') THEN 'Should be 100'
                    WHEN COLUMN_NAME = 'description2' THEN 'Should be 150'
                    WHEN COLUMN_NAME IN ('brand_name', 'item', 'hcpc_code', 'product_type', 'fei_number', 'product_code', 'fda_510_k', 'device_class') THEN 'Should be 75'
                    WHEN COLUMN_NAME IN ('uom_units_inner_2', 'uom_pack_inner_1', 'uom_sellable', 'uom_ship_1', 'uom_ship_2') THEN 'Should be 75'
                    ELSE 'No change expected'
                END as Expected_Size
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'data_team_active_items'
            AND COLUMN_NAME IN (
                'description1', 'description2', 'description3', 'brand_name', 'item',
                'hcpc_code', 'product_type', 'fei_number', 'product_code', 'fda_510_k',
                'device_class', 'uom_units_inner_2', 'uom_pack_inner_1', 'uom_sellable',
                'uom_ship_1', 'uom_ship_2'
            )
            ORDER BY COLUMN_NAME;
        `;

        const verificationResult = await pool.request().query(verificationQuery);
        console.log('📋 Final column sizes verification:');
        console.table(verificationResult.recordset);

    } catch (error) {
        console.error('❌ Script execution failed:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    } finally {
        if (pool) {
            await pool.close();
            console.log('🔒 Database connection closed');
        }
    }
}

executeFieldSizeIncrease();