const express = require('express');
const sql = require('mssql');
const router = express.Router();

// Get new dashboard summary
router.get('/new-dashboard-summary', async (req, res) => {
    try {
        const pool = new sql.ConnectionPool(req.app.locals.dbConfig || {});
        await pool.connect();

        // Get counts from main table
        const mainTableQuery = `
            SELECT
                COUNT(*) as totalItems,
                COUNT(CASE WHEN upc_sellable IS NOT NULL AND upc_sellable != '' AND upc_sellable != 0 THEN 1 END) as itemsWithUPC,
                COUNT(CASE WHEN brand_name LIKE '%NEW%' THEN 1 END) as newBrandItems,
                COUNT(CASE WHEN upc_sellable IS NULL OR upc_sellable = '' OR upc_sellable = 0 THEN 1 END) as itemsWithoutUPC,
                MAX(id) as latestId
            FROM data_team_active_items
        `;

        const mainResult = await pool.query(mainTableQuery);
        const mainStats = mainResult.recordset[0];

        // Check if temp table has data
        const tempCountQuery = `SELECT COUNT(*) as count FROM data_team_active_items_temp`;
        const tempResult = await pool.query(tempCountQuery);
        const tempCount = tempResult.recordset[0].count;

        // Get differences count if temp has data
        let differencesCount = {
            new: 0,
            modified: 0,
            deleted: 0,
            total: 0
        };

        if (tempCount > 0) {
            // Get differences
            const diffQuery = `
                WITH main_data AS (
                    SELECT item, brand_name, description1, upc_inner_2, upc_inner_1, upc_sellable
                    FROM data_team_active_items
                ),
                temp_data AS (
                    SELECT item, brand_name, description1, upc_inner_2, upc_inner_1, upc_sellable
                    FROM data_team_active_items_temp
                ),
                new_items AS (
                    SELECT COUNT(*) as count
                    FROM temp_data t
                    LEFT JOIN main_data m ON t.item = m.item
                    WHERE m.item IS NULL
                ),
                deleted_items AS (
                    SELECT COUNT(*) as count
                    FROM main_data m
                    LEFT JOIN temp_data t ON m.item = t.item
                    WHERE t.item IS NULL
                ),
                modified_items AS (
                    SELECT COUNT(DISTINCT m.item) as count
                    FROM main_data m
                    INNER JOIN temp_data t ON m.item = t.item
                    WHERE
                        ISNULL(m.brand_name, '') != ISNULL(t.brand_name, '')
                        OR ISNULL(m.description1, '') != ISNULL(t.description1, '')
                        OR ISNULL(m.upc_inner_2, 0) != ISNULL(t.upc_inner_2, 0)
                        OR ISNULL(m.upc_inner_1, 0) != ISNULL(t.upc_inner_1, 0)
                        OR ISNULL(m.upc_sellable, 0) != ISNULL(t.upc_sellable, 0)
                )
                SELECT
                    (SELECT count FROM new_items) as new_count,
                    (SELECT count FROM modified_items) as modified_count,
                    (SELECT count FROM deleted_items) as deleted_count
            `;

            const diffResult = await pool.query(diffQuery);
            const diff = diffResult.recordset[0];

            differencesCount = {
                new: diff.new_count || 0,
                modified: diff.modified_count || 0,
                deleted: diff.deleted_count || 0,
                total: (diff.new_count || 0) + (diff.modified_count || 0) + (diff.deleted_count || 0)
            };
        }

        await pool.close();

        res.json({
            success: true,
            mainTable: {
                totalItems: mainStats.totalItems,
                itemsWithUPC: mainStats.itemsWithUPC,
                newBrandItems: mainStats.newBrandItems,
                itemsWithoutUPC: mainStats.itemsWithoutUPC,
                latestId: mainStats.latestId
            },
            tempTable: {
                hasData: tempCount > 0,
                count: tempCount,
                differences: differencesCount
            }
        });

    } catch (error) {
        console.error('New dashboard summary error:', error);
        res.status(500).json({
            success: false,
            error: `Failed to fetch dashboard data: ${error.message}`
        });
    }
});

module.exports = router;
