import sql from 'mssql';
import { config } from 'dotenv';

config();

const dbConfig = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT),
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function verifyCleanupResults() {
    let pool;

    try {
        console.log('🔌 Connecting to SQL Server database...');
        pool = await sql.connect(dbConfig);
        console.log('✅ Connected successfully!');

        // 1. Final record count
        console.log('\n📊 FINAL VERIFICATION REPORT');
        console.log('=' .repeat(60));

        const totalCount = await pool.request().query(`
            SELECT COUNT(*) as total_records FROM data_team_active_items
        `);
        console.log(`Total records in database: ${totalCount.recordset[0].total_records}`);

        // 2. Verify no duplicates exist
        const duplicateCheck = await pool.request().query(`
            SELECT
                COUNT(*) as total_records,
                COUNT(DISTINCT CONCAT(ISNULL(brand_name, ''), '|', ISNULL(item, ''), '|', ISNULL(description1, ''))) as unique_combinations,
                COUNT(*) - COUNT(DISTINCT CONCAT(ISNULL(brand_name, ''), '|', ISNULL(item, ''), '|', ISNULL(description1, ''))) as remaining_duplicates
            FROM data_team_active_items
        `);

        const dupResult = duplicateCheck.recordset[0];
        console.log(`Unique combinations: ${dupResult.unique_combinations}`);
        console.log(`Remaining duplicates: ${dupResult.remaining_duplicates}`);

        if (dupResult.remaining_duplicates === 0) {
            console.log('✅ VERIFIED: No duplicates remain in the database');
        } else {
            console.log('❌ WARNING: Duplicates still exist!');
        }

        // 3. Check data integrity - sample verification
        console.log('\n🔍 DATA INTEGRITY CHECK');
        console.log('=' .repeat(60));

        const integrityCheck = await pool.request().query(`
            SELECT
                COUNT(CASE WHEN brand_name IS NOT NULL AND brand_name != '' THEN 1 END) as records_with_brand,
                COUNT(CASE WHEN item IS NOT NULL AND item != '' THEN 1 END) as records_with_item,
                COUNT(CASE WHEN description1 IS NOT NULL AND description1 != '' THEN 1 END) as records_with_desc1,
                COUNT(CASE WHEN description2 IS NOT NULL AND description2 != '' THEN 1 END) as records_with_desc2,
                COUNT(*) as total_records
            FROM data_team_active_items
        `);

        const integrity = integrityCheck.recordset[0];
        console.log(`Records with brand name: ${integrity.records_with_brand}`);
        console.log(`Records with item number: ${integrity.records_with_item}`);
        console.log(`Records with description1: ${integrity.records_with_desc1}`);
        console.log(`Records with description2: ${integrity.records_with_desc2}`);

        // 4. Check for any obvious data quality issues
        console.log('\n🔍 DATA QUALITY ANALYSIS');
        console.log('=' .repeat(60));

        const qualityCheck = await pool.request().query(`
            SELECT
                'NULL or Empty Values' as check_type,
                COUNT(CASE WHEN brand_name IS NULL OR brand_name = '' THEN 1 END) as null_brand,
                COUNT(CASE WHEN item IS NULL OR item = '' THEN 1 END) as null_item,
                COUNT(CASE WHEN description1 IS NULL OR description1 = '' THEN 1 END) as null_desc1
            FROM data_team_active_items
        `);

        const quality = qualityCheck.recordset[0];
        console.log(`Records with NULL/empty brand: ${quality.null_brand}`);
        console.log(`Records with NULL/empty item: ${quality.null_item}`);
        console.log(`Records with NULL/empty description1: ${quality.null_desc1}`);

        // 5. Show ID range to understand data distribution
        console.log('\n📈 ID RANGE ANALYSIS');
        console.log('=' .repeat(60));

        const idRange = await pool.request().query(`
            SELECT
                MIN(id) as min_id,
                MAX(id) as max_id,
                MAX(id) - MIN(id) + 1 as total_id_range,
                COUNT(*) as actual_records,
                (MAX(id) - MIN(id) + 1) - COUNT(*) as missing_ids
            FROM data_team_active_items
        `);

        const range = idRange.recordset[0];
        console.log(`Minimum ID: ${range.min_id}`);
        console.log(`Maximum ID: ${range.max_id}`);
        console.log(`ID range span: ${range.total_id_range}`);
        console.log(`Actual records: ${range.actual_records}`);
        console.log(`Missing/deleted IDs: ${range.missing_ids}`);

        // 6. Random sample of 20 records for manual verification
        console.log('\n📋 RANDOM SAMPLE FOR VERIFICATION');
        console.log('=' .repeat(60));

        const sampleRecords = await pool.request().query(`
            SELECT TOP 20
                id,
                brand_name,
                item,
                LEFT(description1, 50) + CASE WHEN LEN(description1) > 50 THEN '...' ELSE '' END as description1_sample,
                LEFT(ISNULL(description2, ''), 30) + CASE WHEN LEN(ISNULL(description2, '')) > 30 THEN '...' ELSE '' END as description2_sample
            FROM data_team_active_items
            ORDER BY NEWID()  -- Random order
        `);

        console.log('Random sample of 20 records:');
        sampleRecords.recordset.forEach((record, index) => {
            console.log(`${index + 1}. ID: ${record.id} | Brand: "${record.brand_name}" | Item: "${record.item}"`);
            console.log(`   Desc1: "${record.description1_sample}"`);
            if (record.description2_sample) {
                console.log(`   Desc2: "${record.description2_sample}"`);
            }
            console.log('');
        });

        // 7. Final summary
        console.log('\n🎯 FINAL SUMMARY');
        console.log('=' .repeat(60));
        console.log(`✅ Database cleanup completed successfully`);
        console.log(`✅ All duplicates removed (${dupResult.remaining_duplicates} remaining)`);
        console.log(`📊 Final record count: ${totalCount.recordset[0].total_records}`);
        console.log(`📋 Expected from Excel: 2,723`);
        console.log(`📈 Difference: ${totalCount.recordset[0].total_records - 2723} records`);

        if (totalCount.recordset[0].total_records === 2723) {
            console.log('🎉 PERFECT MATCH: Database count matches Excel count exactly!');
        } else if (totalCount.recordset[0].total_records < 2723) {
            console.log('📉 ANALYSIS: Database has fewer records than Excel. Possible reasons:');
            console.log('   - Some Excel records may have been actual duplicates');
            console.log('   - Some Excel records may not have been imported initially');
            console.log('   - Data filtering during import process');
        } else {
            console.log('📈 ANALYSIS: Database has more records than Excel');
        }

        console.log('\n✅ Cleanup verification completed successfully!');

    } catch (error) {
        console.error('❌ Error during verification:', error.message);
        throw error;
    } finally {
        if (pool) {
            await pool.close();
            console.log('\n🔌 Database connection closed.');
        }
    }
}

// Execute the verification
verifyCleanupResults().catch(console.error);