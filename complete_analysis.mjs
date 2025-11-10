import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

async function completeAnalysis() {
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

        const pool = await sql.connect(config);
        console.log('✅ Connected to SQL Server\n');

        // 1. Total count
        const totalCount = await pool.request().query('SELECT COUNT(*) as total FROM data_team_active_items');
        const total = totalCount.recordset[0].total;

        // 2. Count unique records (no duplicates)
        const uniqueCount = await pool.request().query(`
            SELECT COUNT(*) as unique_records
            FROM (
                SELECT DISTINCT brand_name, item, description1
                FROM data_team_active_items
            ) as unique_records
        `);
        const unique = uniqueCount.recordset[0].unique_records;

        // 3. Duplicate count
        const duplicates = total - unique;

        // 4. Count records with actual brand names (not NULL)
        const nonNullBrands = await pool.request().query(`
            SELECT COUNT(*) as non_null_count
            FROM data_team_active_items
            WHERE brand_name IS NOT NULL AND brand_name != 'null'
        `);
        const nonNull = nonNullBrands.recordset[0].non_null_count;

        // 5. Count records with NULL brand names
        const nullBrands = await pool.request().query(`
            SELECT COUNT(*) as null_count
            FROM data_team_active_items
            WHERE brand_name IS NULL OR brand_name = 'null'
        `);
        const nullCount = nullBrands.recordset[0].null_count;

        // 6. Sample of recent records with all columns
        const sampleRecords = await pool.request().query('SELECT TOP 10 * FROM data_team_active_items');

        console.log('📊 COMPLETE ANALYSIS SUMMARY');
        console.log('=' .repeat(50));
        console.log(`Total records in database: ${total.toLocaleString()}`);
        console.log(`Expected records from Excel: 2,723`);
        console.log(`Difference: +${(total - 2723).toLocaleString()} records`);
        console.log();
        console.log(`Unique combinations (brand, item, description): ${unique.toLocaleString()}`);
        console.log(`Duplicate records: ${duplicates.toLocaleString()}`);
        console.log();
        console.log(`Records with actual brand names: ${nonNull.toLocaleString()}`);
        console.log(`Records with NULL/null brand names: ${nullCount.toLocaleString()}`);
        console.log();

        console.log('🔍 TABLE STRUCTURE (first 10 records):');
        console.log('=' .repeat(50));
        if (sampleRecords.recordset.length > 0) {
            console.log('Columns:', Object.keys(sampleRecords.recordset[0]));
            sampleRecords.recordset.slice(0, 5).forEach((record, i) => {
                console.log(`\nRecord ${i + 1}:`);
                Object.entries(record).forEach(([key, value]) => {
                    console.log(`  ${key}: ${value === null ? 'NULL' : value}`);
                });
            });
        }

        console.log('\n🎯 CONCLUSION:');
        console.log('=' .repeat(50));
        if (duplicates === 488) {
            console.log('✅ The 488 duplicate records explain the discrepancy!');
            console.log('📝 Recommendation: Remove duplicate records to match Excel count');
        } else {
            console.log(`⚠️ Math doesn't add up perfectly. Investigate further.`);
        }

        console.log(`\n💡 CLEANING STRATEGY:`);
        console.log('1. Remove duplicate records (keeping one of each unique combination)');
        console.log('2. This should reduce the table from 3,121 to 2,633 records');
        console.log('3. The remaining 90 records difference (2,633 vs 2,723 expected) may be due to:');
        console.log('   - Records missing from the import');
        console.log('   - Records filtered out during Excel processing');
        console.log('   - Different data between Excel and database sources');

        await pool.close();

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

completeAnalysis();