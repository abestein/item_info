const express = require('express');
const sql = require('mssql');
const router = express.Router();

// Get differences between main table and temp table
router.get('/compare-data-team', async (req, res) => {
    try {
        const pool = new sql.ConnectionPool(req.app.locals.dbConfig || {});
        await pool.connect();

        // First check if temp table has any data
        const tempCountResult = await pool.query`SELECT COUNT(*) as count FROM data_team_active_items_temp`;
        const tempCount = tempCountResult.recordset[0].count;

        // If temp table is empty, return no differences
        if (tempCount === 0) {
            await pool.close();
            return res.json({
                success: true,
                differences: []
            });
        }

        // Complex SQL query to find all differences
        const query = `
            WITH main_data AS (
                SELECT
                    id,
                    brand_name,
                    item,
                    description1,
                    description2,
                    description3,
                    uom_units_inner_2,
                    uom_pack_inner_1,
                    uom_sellable,
                    upc_inner_2,
                    upc_inner_1,
                    upc_sellable,
                    hcpc_code,
                    product_type,
                    exp_date,
                    sterile
                FROM data_team_active_items
            ),
            temp_data AS (
                SELECT
                    id,
                    brand_name,
                    item,
                    description1,
                    description2,
                    description3,
                    uom_units_inner_2,
                    uom_pack_inner_1,
                    uom_sellable,
                    upc_inner_2,
                    upc_inner_1,
                    upc_sellable,
                    hcpc_code,
                    product_type,
                    exp_date,
                    sterile
                FROM data_team_active_items_temp
            ),
            new_records AS (
                SELECT
                    'NEW' as change_type,
                    t.id,
                    t.item as item_code,
                    t.brand_name,
                    t.description1,
                    'All Fields' as field_name,
                    '' as current_value,
                    CONCAT('New: ', t.brand_name, ' - ', t.item) as new_value,
                    1 as sort_order
                FROM temp_data t
                LEFT JOIN main_data m ON t.item = m.item
                WHERE m.item IS NULL
            ),
            deleted_records AS (
                SELECT
                    'DELETED' as change_type,
                    m.id,
                    m.item as item_code,
                    m.brand_name,
                    m.description1,
                    'All Fields' as field_name,
                    CONCAT('Existing: ', m.brand_name, ' - ', m.item) as current_value,
                    '' as new_value,
                    3 as sort_order
                FROM main_data m
                LEFT JOIN temp_data t ON m.item = t.item
                WHERE t.item IS NULL
            ),
            modified_records AS (
                -- Brand Name changes
                SELECT
                    'MODIFIED' as change_type,
                    m.id,
                    m.item as item_code,
                    m.brand_name,
                    m.description1,
                    'brand_name' as field_name,
                    m.brand_name as current_value,
                    t.brand_name as new_value,
                    2 as sort_order
                FROM main_data m
                INNER JOIN temp_data t ON m.item = t.item
                WHERE ISNULL(m.brand_name, '') != ISNULL(t.brand_name, '')

                UNION ALL

                -- Description1 changes
                SELECT
                    'MODIFIED' as change_type,
                    m.id,
                    m.item as item_code,
                    m.brand_name,
                    m.description1,
                    'description1' as field_name,
                    m.description1 as current_value,
                    t.description1 as new_value,
                    2 as sort_order
                FROM main_data m
                INNER JOIN temp_data t ON m.item = t.item
                WHERE ISNULL(m.description1, '') != ISNULL(t.description1, '')

                UNION ALL

                -- UPC Inner-2 changes
                SELECT
                    'MODIFIED' as change_type,
                    m.id,
                    m.item as item_code,
                    m.brand_name,
                    m.description1,
                    'upc_inner_2' as field_name,
                    CAST(m.upc_inner_2 as VARCHAR) as current_value,
                    CAST(t.upc_inner_2 as VARCHAR) as new_value,
                    2 as sort_order
                FROM main_data m
                INNER JOIN temp_data t ON m.item = t.item
                WHERE ISNULL(m.upc_inner_2, 0) != ISNULL(t.upc_inner_2, 0)

                UNION ALL

                -- UPC Inner-1 changes
                SELECT
                    'MODIFIED' as change_type,
                    m.id,
                    m.item as item_code,
                    m.brand_name,
                    m.description1,
                    'upc_inner_1' as field_name,
                    CAST(m.upc_inner_1 as VARCHAR) as current_value,
                    CAST(t.upc_inner_1 as VARCHAR) as new_value,
                    2 as sort_order
                FROM main_data m
                INNER JOIN temp_data t ON m.item = t.item
                WHERE ISNULL(m.upc_inner_1, 0) != ISNULL(t.upc_inner_1, 0)

                UNION ALL

                -- UPC Sellable changes
                SELECT
                    'MODIFIED' as change_type,
                    m.id,
                    m.item as item_code,
                    m.brand_name,
                    m.description1,
                    'upc_sellable' as field_name,
                    CAST(m.upc_sellable as VARCHAR) as current_value,
                    CAST(t.upc_sellable as VARCHAR) as new_value,
                    2 as sort_order
                FROM main_data m
                INNER JOIN temp_data t ON m.item = t.item
                WHERE ISNULL(m.upc_sellable, 0) != ISNULL(t.upc_sellable, 0)
            )

            SELECT * FROM new_records
            UNION ALL
            SELECT * FROM deleted_records
            UNION ALL
            SELECT * FROM modified_records
            ORDER BY sort_order, item_code, field_name
        `;

        const result = await pool.query(query);
        await pool.close();

        res.json({
            success: true,
            differences: result.recordset
        });

    } catch (error) {
        console.error('Comparison error:', error);
        res.status(500).json({
            success: false,
            error: `Failed to compare tables: ${error.message}`
        });
    }
});

// Apply selected changes to main table
router.post('/apply-data-team-changes', async (req, res) => {
    try {
        const { changeIds } = req.body;

        if (!changeIds || !Array.isArray(changeIds) || changeIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No changes specified'
            });
        }

        const pool = new sql.ConnectionPool(req.app.locals.dbConfig || {});
        await pool.connect();

        let appliedCount = 0;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            for (const changeId of changeIds) {
                // Split by ||| delimiter to handle field names with underscores
                const parts = changeId.split('|||');
                const changeType = parts[0];
                const itemCode = parts[1];
                const fieldName = parts[2];

                console.log(`Applying ${changeType} for item ${itemCode}, field: ${fieldName}`);

                switch (changeType) {
                    case 'NEW':
                        // Insert new record from temp table
                        await transaction.request()
                            .input('itemCode', sql.NVarChar, itemCode)
                            .query(`
                                INSERT INTO data_team_active_items (
                                    brand_name, item, description1, description2, description3,
                                    uom_units_inner_2, uom_pack_inner_1, uom_sellable, uom_ship_1, uom_ship_2,
                                    upc_inner_2, upc_inner_1, upc_sellable, upc_ship_1, upc_ship_2,
                                    ar_inner_2, ar_inner_1, ar_sellable, ar_ship_1, ar_ship_2,
                                    hcpc_code, product_type, fei_number, duns_number, dln, device_class, product_code,
                                    fda_510_k, exp_date, sn_number, sterile, sterile_method, shelf_life,
                                    prop_65, prop_65_warning, rx_required, dehp_free, latex, use_field,
                                    temp_required, temp_range, humidity_limitation,
                                    gtin_inner_2, gtin_inner_1, gtin_sellable, gtin_ship_1, gtin_ship_2,
                                    product_identification, term_code,
                                    ndc_inner_2, ndc_inner_1, ndc_sellable, ndc_shipper_1, ndc_shipper_2,
                                    hc_class, license_number
                                )
                                SELECT
                                    brand_name, item, description1, description2, description3,
                                    uom_units_inner_2, uom_pack_inner_1, uom_sellable, uom_ship_1, uom_ship_2,
                                    upc_inner_2, upc_inner_1, upc_sellable, upc_ship_1, upc_ship_2,
                                    ar_inner_2, ar_inner_1, ar_sellable, ar_ship_1, ar_ship_2,
                                    hcpc_code, product_type, fei_number, duns_number, dln, device_class, product_code,
                                    fda_510_k, exp_date, sn_number, sterile, sterile_method, shelf_life,
                                    prop_65, prop_65_warning, rx_required, dehp_free, latex, use_field,
                                    temp_required, temp_range, humidity_limitation,
                                    gtin_inner_2, gtin_inner_1, gtin_sellable, gtin_ship_1, gtin_ship_2,
                                    product_identification, term_code,
                                    ndc_inner_2, ndc_inner_1, ndc_sellable, ndc_shipper_1, ndc_shipper_2,
                                    hc_class, license_number
                                FROM data_team_active_items_temp
                                WHERE item = @itemCode
                            `);
                        appliedCount++;
                        break;

                    case 'MODIFIED':
                        // Update specific field from temp table
                        if (fieldName && fieldName !== 'undefined' && fieldName !== 'Fields') {
                            const request = transaction.request()
                                .input('itemCode', sql.NVarChar, itemCode);

                            await request.query(`
                                UPDATE m SET m.${fieldName} = t.${fieldName}
                                FROM data_team_active_items m
                                INNER JOIN data_team_active_items_temp t ON m.item = t.item
                                WHERE m.item = @itemCode
                            `);
                        }
                        appliedCount++;
                        break;

                    case 'DELETED':
                        // Delete record from main table
                        await transaction.request()
                            .input('itemCode', sql.NVarChar, itemCode)
                            .query(`DELETE FROM data_team_active_items WHERE item = @itemCode`);
                        appliedCount++;
                        break;
                }
            }

            await transaction.commit();

            await pool.close();

            res.json({
                success: true,
                appliedCount,
                message: `Successfully applied ${appliedCount} changes`
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Apply changes error:', error);
        res.status(500).json({
            success: false,
            error: `Failed to apply changes: ${error.message}`
        });
    }
});

// Delete/Clear temp table
router.post('/delete-temp-table', async (req, res) => {
    try {
        const pool = new sql.ConnectionPool(req.app.locals.dbConfig || {});
        await pool.connect();

        // Clear temp table
        console.log('Clearing temp table...');
        await pool.request().query('TRUNCATE TABLE data_team_active_items_temp');
        console.log('Temp table cleared successfully');

        await pool.close();

        res.json({
            success: true,
            message: 'Temp table deleted successfully'
        });

    } catch (error) {
        console.error('Delete temp table error:', error);
        res.status(500).json({
            success: false,
            error: `Failed to delete temp table: ${error.message}`
        });
    }
});

// Refresh UPC List - Execute sp_Refresh_UPC_List stored procedure
router.post('/refresh-upc-list', async (req, res) => {
    try {
        const pool = new sql.ConnectionPool(req.app.locals.dbConfig || {});
        await pool.connect();

        console.log('Executing sp_Refresh_UPC_List...');
        const result = await pool.request().execute('sp_Refresh_UPC_List');

        const rowsInserted = result.recordset && result.recordset[0] ? result.recordset[0].RowsInserted : 0;
        console.log(`UPC List refreshed successfully. Rows inserted: ${rowsInserted}`);

        await pool.close();

        res.json({
            success: true,
            rowsInserted: rowsInserted,
            message: `UPC List refreshed successfully with ${rowsInserted} records`
        });

    } catch (error) {
        console.error('Refresh UPC List error:', error);
        res.status(500).json({
            success: false,
            error: `Failed to refresh UPC list: ${error.message}`
        });
    }
});

// Get UPC List data
router.get('/upc-list', async (req, res) => {
    try {
        const pool = new sql.ConnectionPool(req.app.locals.dbConfig || {});
        await pool.connect();

        console.log('Fetching UPC List data...');
        const result = await pool.request().query(`
            SELECT
                ID,
                ItemCode,
                Level,
                UPC,
                LevelNumber,
                IsSellable
            FROM UPC_list
            ORDER BY ItemCode, LevelNumber
        `);

        console.log(`UPC List data fetched: ${result.recordset.length} records`);

        await pool.close();

        res.json({
            success: true,
            data: result.recordset,
            totalRecords: result.recordset.length
        });

    } catch (error) {
        console.error('Get UPC List error:', error);
        res.status(500).json({
            success: false,
            error: `Failed to fetch UPC list: ${error.message}`
        });
    }
});

module.exports = router;