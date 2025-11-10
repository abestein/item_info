import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

async function analyzeDataDiscrepancy() {
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

        console.log('🔍 Analyzing data discrepancy in data_team_active_items table...\n');
        console.log('Connecting to:', {
            server: config.server,
            database: config.database,
            user: config.user
        });

        const pool = await sql.connect(config);
        console.log('✅ Connected to SQL Server successfully!\n');

        // 1. Get the total count
        console.log('📊 QUERY 1: Total record count');
        console.log('=' .repeat(50));
        const totalCount = await pool.request().query(`
            SELECT COUNT(*) as total_records FROM data_team_active_items
        `);
        const totalRecords = totalCount.recordset[0].total_records;
        console.log(`Total records: ${totalRecords}`);
        console.log(`Expected records: 2,723`);
        console.log(`Difference: +${totalRecords - 2723} records\n`);

        // 2. Check for duplicate records by key fields
        console.log('🔍 QUERY 2: Checking for duplicate records by key fields');
        console.log('=' .repeat(50));
        const duplicates = await pool.request().query(`
            SELECT brand_name, item, description1, COUNT(*) as duplicate_count
            FROM data_team_active_items
            GROUP BY brand_name, item, description1
            HAVING COUNT(*) > 1
            ORDER BY duplicate_count DESC
        `);

        if (duplicates.recordset.length > 0) {
            console.log(`Found ${duplicates.recordset.length} sets of duplicate records:`);
            duplicates.recordset.forEach((row, index) => {
                console.log(`${index + 1}. Brand: "${row.brand_name}" | Item: "${row.item}" | Description: "${row.description1}" | Count: ${row.duplicate_count}`);
            });

            // Calculate total duplicate records
            const totalDuplicates = duplicates.recordset.reduce((sum, row) => sum + (row.duplicate_count - 1), 0);
            console.log(`\nTotal duplicate records: ${totalDuplicates}`);
        } else {
            console.log('No duplicate records found by key fields (brand_name, item, description1)');
        }
        console.log();

        // 3. Check recent records (assuming there's an id field)
        console.log('📅 QUERY 3: Most recent records (last 20)');
        console.log('=' .repeat(50));
        try {
            const recentRecords = await pool.request().query(`
                SELECT TOP 20 * FROM data_team_active_items ORDER BY id DESC
            `);
            console.log(`Found ${recentRecords.recordset.length} recent records:`);
            recentRecords.recordset.forEach((row, index) => {
                console.log(`${index + 1}. ID: ${row.id} | Brand: "${row.brand_name}" | Item: "${row.item}"`);
            });
        } catch (error) {
            console.log('Note: Could not order by ID field (may not exist). Trying alternative approach...');
            try {
                const recentRecords = await pool.request().query(`
                    SELECT TOP 20 brand_name, item, description1 FROM data_team_active_items
                `);
                console.log(`Showing first 20 records instead:`);
                recentRecords.recordset.forEach((row, index) => {
                    console.log(`${index + 1}. Brand: "${row.brand_name}" | Item: "${row.item}" | Description: "${row.description1}"`);
                });
            } catch (innerError) {
                console.log('Error retrieving recent records:', innerError.message);
            }
        }
        console.log();

        // 4. Brand analysis
        console.log('🏷️  QUERY 4: Records count per brand');
        console.log('=' .repeat(50));
        const brandAnalysis = await pool.request().query(`
            SELECT brand_name, COUNT(*) as count_per_brand
            FROM data_team_active_items
            GROUP BY brand_name
            ORDER BY count_per_brand DESC
        `);

        console.log(`Found ${brandAnalysis.recordset.length} different brands:`);
        brandAnalysis.recordset.slice(0, 20).forEach((row, index) => {
            console.log(`${index + 1}. "${row.brand_name}": ${row.count_per_brand} records`);
        });

        if (brandAnalysis.recordset.length > 20) {
            console.log(`... and ${brandAnalysis.recordset.length - 20} more brands`);
        }
        console.log();

        // 5. Check for NULL or empty brand_name records
        console.log('❓ QUERY 5: NULL or empty brand_name records');
        console.log('=' .repeat(50));
        const nullBrands = await pool.request().query(`
            SELECT COUNT(*) as null_brand_count FROM data_team_active_items
            WHERE brand_name IS NULL OR brand_name = ''
        `);
        const nullBrandCount = nullBrands.recordset[0].null_brand_count;
        console.log(`Records with NULL or empty brand_name: ${nullBrandCount}`);

        if (nullBrandCount > 0) {
            console.log('This could indicate test data or import issues.');
            // Show sample of null brand records
            const nullSamples = await pool.request().query(`
                SELECT TOP 10 * FROM data_team_active_items
                WHERE brand_name IS NULL OR brand_name = ''
            `);
            console.log('Sample records with NULL/empty brand_name:');
            nullSamples.recordset.forEach((row, index) => {
                console.log(`${index + 1}. Item: "${row.item}" | Description: "${row.description1}"`);
            });
        }
        console.log();

        // Additional analysis: Check for completely identical records
        console.log('🔄 ADDITIONAL QUERY: Checking for completely identical records');
        console.log('=' .repeat(50));

        // First, let's see what columns exist
        const columnInfo = await pool.request().query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'data_team_active_items'
            ORDER BY ORDINAL_POSITION
        `);

        const columns = columnInfo.recordset.map(row => row.COLUMN_NAME);
        console.log(`Table columns: ${columns.join(', ')}`);

        // Create a query to check for completely identical records (excluding potential ID column)
        const nonIdColumns = columns.filter(col => col.toLowerCase() !== 'id');
        if (nonIdColumns.length > 0) {
            const columnList = nonIdColumns.join(', ');
            const identicalRecords = await pool.request().query(`
                SELECT ${columnList}, COUNT(*) as identical_count
                FROM data_team_active_items
                GROUP BY ${columnList}
                HAVING COUNT(*) > 1
                ORDER BY identical_count DESC
            `);

            if (identicalRecords.recordset.length > 0) {
                console.log(`Found ${identicalRecords.recordset.length} sets of completely identical records:`);
                identicalRecords.recordset.slice(0, 10).forEach((row, index) => {
                    console.log(`${index + 1}. Count: ${row.identical_count} | Brand: "${row.brand_name}" | Item: "${row.item}"`);
                });

                const totalIdenticalDuplicates = identicalRecords.recordset.reduce((sum, row) => sum + (row.identical_count - 1), 0);
                console.log(`\nTotal completely identical duplicate records: ${totalIdenticalDuplicates}`);
            } else {
                console.log('No completely identical records found.');
            }
        }
        console.log();

        // Summary
        console.log('📋 SUMMARY');
        console.log('=' .repeat(50));
        console.log(`• Total records in database: ${totalRecords}`);
        console.log(`• Expected records from Excel: 2,723`);
        console.log(`• Difference: +${totalRecords - 2723} records`);
        console.log(`• NULL/empty brand names: ${nullBrandCount}`);
        console.log(`• Unique brands: ${brandAnalysis.recordset.length}`);

        if (duplicates.recordset.length > 0) {
            const keyFieldDuplicates = duplicates.recordset.reduce((sum, row) => sum + (row.duplicate_count - 1), 0);
            console.log(`• Duplicate records by key fields: ${keyFieldDuplicates}`);
        }

        await pool.close();
        console.log('\n✅ Analysis complete!');

    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
        console.error('Full error:', error);
    }
}

analyzeDataDiscrepancy();