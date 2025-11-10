import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

async function investigateDuplicates() {
    let pool = null;

    try {
        // Database configuration
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

        console.log('🔌 Connecting to SQL Server...');
        console.log(`   Server: ${config.server}:${config.port}`);
        console.log(`   Database: ${config.database}`);
        console.log(`   User: ${config.user}`);

        pool = await sql.connect(config);
        console.log('✅ Connected to SQL Server successfully!\n');

        // 1. Check current record count
        console.log('=' .repeat(60));
        console.log('1. CURRENT RECORD COUNT');
        console.log('=' .repeat(60));

        const totalCount = await pool.request().query(`
            SELECT COUNT(*) as total_records
            FROM data_team_active_items
        `);

        console.log(`Total records in data_team_active_items: ${totalCount.recordset[0].total_records.toLocaleString()}`);

        // 2. Check for duplicates by brand_name, item, and description1
        console.log('\n' + '=' .repeat(60));
        console.log('2. DUPLICATE ANALYSIS');
        console.log('=' .repeat(60));

        const duplicateCount = await pool.request().query(`
            SELECT
                COUNT(*) as total_rows,
                COUNT(DISTINCT CONCAT(
                    ISNULL(brand_name, ''), '|',
                    ISNULL(item, ''), '|',
                    ISNULL(description1, '')
                )) as unique_combinations,
                COUNT(*) - COUNT(DISTINCT CONCAT(
                    ISNULL(brand_name, ''), '|',
                    ISNULL(item, ''), '|',
                    ISNULL(description1, '')
                )) as duplicate_records
            FROM data_team_active_items
        `);

        const result = duplicateCount.recordset[0];
        console.log(`Total rows: ${result.total_rows.toLocaleString()}`);
        console.log(`Unique combinations: ${result.unique_combinations.toLocaleString()}`);
        console.log(`Duplicate records: ${result.duplicate_records.toLocaleString()}`);

        if (result.duplicate_records > 0) {
            const duplicatePercentage = ((result.duplicate_records / result.total_rows) * 100).toFixed(2);
            console.log(`Duplication rate: ${duplicatePercentage}%`);
        }

        // 3. Find groups with duplicates
        console.log('\n' + '=' .repeat(60));
        console.log('3. DUPLICATE GROUPS SUMMARY');
        console.log('=' .repeat(60));

        const duplicateGroups = await pool.request().query(`
            SELECT
                brand_name,
                item,
                description1,
                COUNT(*) as duplicate_count,
                MIN(id) as first_record_id,
                MAX(id) as last_record_id,
                MIN(created_date) as first_created,
                MAX(created_date) as last_created
            FROM data_team_active_items
            GROUP BY brand_name, item, description1
            HAVING COUNT(*) > 1
            ORDER BY COUNT(*) DESC, brand_name, item
        `);

        if (duplicateGroups.recordset.length > 0) {
            console.log(`Found ${duplicateGroups.recordset.length} groups with duplicates:`);

            // Show top 10 most duplicated items
            console.log('\nTop 10 most duplicated items:');
            duplicateGroups.recordset.slice(0, 10).forEach((group, index) => {
                console.log(`${index + 1}. Brand: "${group.brand_name || 'NULL'}" | Item: "${group.item || 'NULL'}" | Description: "${group.description1 || 'NULL'}"`);
                console.log(`   Duplicates: ${group.duplicate_count} | IDs: ${group.first_record_id} - ${group.last_record_id}`);
                console.log(`   Created: ${group.first_created?.toISOString()?.substring(0, 19)} - ${group.last_created?.toISOString()?.substring(0, 19)}`);
                console.log('');
            });

            // Duplication frequency analysis
            console.log('\n' + '-'.repeat(40));
            console.log('DUPLICATION FREQUENCY ANALYSIS');
            console.log('-'.repeat(40));

            const frequency = await pool.request().query(`
                WITH DuplicateCounts AS (
                    SELECT
                        brand_name,
                        item,
                        description1,
                        COUNT(*) as duplicate_count
                    FROM data_team_active_items
                    GROUP BY brand_name, item, description1
                    HAVING COUNT(*) > 1
                )
                SELECT
                    duplicate_count,
                    COUNT(*) as groups_with_this_count,
                    duplicate_count * COUNT(*) as total_records_in_groups
                FROM DuplicateCounts
                GROUP BY duplicate_count
                ORDER BY duplicate_count DESC
            `);

            frequency.recordset.forEach(freq => {
                console.log(`${freq.duplicate_count} duplicates: ${freq.groups_with_this_count} groups (${freq.total_records_in_groups} total records)`);
            });

        } else {
            console.log('No duplicate groups found.');
        }

        // 4. Show examples of actual duplicate records
        console.log('\n' + '=' .repeat(60));
        console.log('4. EXAMPLE DUPLICATE RECORDS');
        console.log('=' .repeat(60));

        if (duplicateGroups.recordset.length > 0) {
            // Get full details for first duplicate group
            const firstGroup = duplicateGroups.recordset[0];

            const exampleDuplicates = await pool.request()
                .input('brand_name', sql.VarChar, firstGroup.brand_name)
                .input('item', sql.VarChar, firstGroup.item)
                .input('description1', sql.VarChar, firstGroup.description1)
                .query(`
                    SELECT
                        id,
                        created_date,
                        brand_name,
                        item,
                        description1,
                        description2,
                        description3,
                        uom_sellable,
                        upc_sellable
                    FROM data_team_active_items
                    WHERE
                        (brand_name = @brand_name OR (brand_name IS NULL AND @brand_name IS NULL))
                        AND (item = @item OR (item IS NULL AND @item IS NULL))
                        AND (description1 = @description1 OR (description1 IS NULL AND @description1 IS NULL))
                    ORDER BY id
                `);

            console.log(`Example: All ${exampleDuplicates.recordset.length} records for most duplicated item:`);
            exampleDuplicates.recordset.forEach((record, index) => {
                console.log(`\nRecord ${index + 1} (ID: ${record.id}):`);
                console.log(`  Created: ${record.created_date?.toISOString()?.substring(0, 19)}`);
                console.log(`  Brand: "${record.brand_name || 'NULL'}"`);
                console.log(`  Item: "${record.item || 'NULL'}"`);
                console.log(`  Description1: "${record.description1 || 'NULL'}"`);
                console.log(`  Description2: "${record.description2 || 'NULL'}"`);
                console.log(`  Description3: "${record.description3 || 'NULL'}"`);
                console.log(`  UOM Sellable: "${record.uom_sellable || 'NULL'}"`);
                console.log(`  UPC Sellable: ${record.upc_sellable || 'NULL'}`);
            });
        }

        // 5. Creation date analysis to understand import timing
        console.log('\n' + '=' .repeat(60));
        console.log('5. IMPORT TIMING ANALYSIS');
        console.log('=' .repeat(60));

        const timingAnalysis = await pool.request().query(`
            SELECT
                CAST(created_date as DATE) as import_date,
                COUNT(*) as records_imported,
                MIN(created_date) as first_import_time,
                MAX(created_date) as last_import_time
            FROM data_team_active_items
            GROUP BY CAST(created_date as DATE)
            ORDER BY import_date DESC
        `);

        console.log('Records imported by date:');
        timingAnalysis.recordset.forEach(timing => {
            console.log(`${timing.import_date.toISOString().substring(0, 10)}: ${timing.records_imported.toLocaleString()} records`);
            console.log(`  Time range: ${timing.first_import_time?.toISOString()?.substring(11, 19)} - ${timing.last_import_time?.toISOString()?.substring(11, 19)}`);
        });

        // 6. Summary and recommendations
        console.log('\n' + '=' .repeat(60));
        console.log('6. SUMMARY AND RECOMMENDATIONS');
        console.log('=' .repeat(60));

        if (result.duplicate_records > 0) {
            console.log('🚨 DUPLICATE DATA DETECTED:');
            console.log(`   - ${result.duplicate_records.toLocaleString()} duplicate records found (${((result.duplicate_records / result.total_rows) * 100).toFixed(2)}%)`);
            console.log(`   - ${duplicateGroups.recordset.length} unique items have duplicates`);
            console.log(`   - After cleanup, you would have ${result.unique_combinations.toLocaleString()} unique records`);
            console.log('\n✅ RECOMMENDED ACTIONS:');
            console.log('   1. Review the cleanup_duplicates.sql script');
            console.log('   2. Create a backup of the table before cleanup');
            console.log('   3. Run the cleanup script to remove duplicates (keeps oldest record by ID)');
            console.log('   4. Investigate import process to prevent future duplicates');
        } else {
            console.log('✅ No duplicates found. Data integrity is good.');
        }

    } catch (error) {
        console.error('❌ Error during duplicate investigation:', error.message);
        if (error.number) {
            console.error(`SQL Error Number: ${error.number}`);
        }
    } finally {
        if (pool) {
            await pool.close();
            console.log('\n🔌 Database connection closed.');
        }
    }
}

// Run the investigation
investigateDuplicates();