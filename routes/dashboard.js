const express = require('express');
const sql = require('mssql');

// Export a function that receives dbConfig
module.exports = (dbConfig) => {
    const router = express.Router();

    // Get dashboard summary
    router.get('/summary', async (req, res) => {
        try {
            const pool = await sql.connect(dbConfig);

            // Get summary data
            const summaryResult = await pool.request()
                .query('SELECT * FROM vw_Barry_List_Summary');

            // Get issues breakdown
            const issuesResult = await pool.request()
                .query(`
            SELECT 
              CASE 
                WHEN duplicate_type_1 IS NOT NULL THEN 'Duplicate UPCs (Same Item)'
                WHEN duplicate_type_2 IS NOT NULL THEN 'Duplicate UPCs (Cross Items)'
                WHEN length_issue = 'Too Short' THEN 'UPC Too Short'
                WHEN length_issue = 'Too Long' THEN 'UPC Too Long'
                WHEN sellable_issue IS NOT NULL THEN 'Missing Sellable'
              END as issue_type,
              COUNT(*) as count
            FROM vw_Barry_List_Issues
            WHERE has_issue = 1
            GROUP BY 
              CASE 
                WHEN duplicate_type_1 IS NOT NULL THEN 'Duplicate UPCs (Same Item)'
                WHEN duplicate_type_2 IS NOT NULL THEN 'Duplicate UPCs (Cross Items)'
                WHEN length_issue = 'Too Short' THEN 'UPC Too Short'
                WHEN length_issue = 'Too Long' THEN 'UPC Too Long'
                WHEN sellable_issue IS NOT NULL THEN 'Missing Sellable'
              END
          `);

            // Get system matching summary
            const systemResult = await pool.request()
                .query('SELECT * FROM vw_System_Matching_Summary');

            // Get excluded items breakdown
            const excludedResult = await pool.request()
                .query(`
            SELECT 
              Exclusion_Reason,
              COUNT(*) as ItemCount
            FROM vw_Dimensioner_Excluded_Items
            GROUP BY Exclusion_Reason
            ORDER BY ItemCount DESC
          `);

            res.json({
                summary: summaryResult.recordset[0],
                barryIssues: issuesResult.recordset,
                systemSummary: systemResult.recordset[0],
                excludedBreakdown: excludedResult.recordset
            });
        } catch (error) {
            console.error('Dashboard summary error:', error);
            res.status(500).json({ error: 'Failed to fetch dashboard data' });
        }
    });

    // Get Barry List issues with pagination
    router.get('/barry-issues', async (req, res) => {
        try {
            const pool = await sql.connect(dbConfig);
            const { page = 1, pageSize = 25, searchTerm = '', issueType = '' } = req.query;
            const offset = (page - 1) * pageSize;

            let whereClause = 'WHERE has_issue = 1';

            const request = new sql.Request(pool);
            
            if (searchTerm) {
                whereClause += ' AND (ItemCode LIKE @searchTerm OR UPC LIKE @searchTerm)';
                request.input('searchTerm', sql.NVarChar, `%${searchTerm}%`);
            }

            if (issueType) {
                request.input('issueType', sql.NVarChar, issueType);
                switch (issueType) {
                    case 'duplicate_same':
                        whereClause += ' AND duplicate_type_1 IS NOT NULL';
                        break;
                    case 'duplicate_cross':
                        whereClause += ' AND duplicate_type_2 IS NOT NULL';
                        break;
                    case 'length_short':
                        whereClause += " AND length_issue = 'Too Short'";
                        break;
                    case 'length_long':
                        whereClause += " AND length_issue = 'Too Long'";
                        break;
                    case 'missing_sellable':
                        whereClause += ' AND sellable_issue IS NOT NULL';
                        break;
                }
            }

            // Get total count
            const countResult = await pool.request()
                .query(`SELECT COUNT(*) as total FROM vw_Barry_List_Issues ${whereClause}`);

            // Get paginated data
            const dataResult = await pool.request()
                .query(`
            SELECT 
              ItemCode,
              Level,
              UPC,
              LevelNumber,
              IsSellable,
              duplicate_type_1,
              duplicate_type_2,
              cross_duplicate_items,
              length_issue,
              upc_length,
              sellable_issue
            FROM vw_Barry_List_Issues
            ${whereClause}
            ORDER BY ItemCode, LevelNumber
            OFFSET ${offset} ROWS
            FETCH NEXT ${pageSize} ROWS ONLY
          `);

            res.json({
                data: dataResult.recordset,
                totalCount: countResult.recordset[0].total
            });
        } catch (error) {
            console.error('Barry issues error:', error);
            res.status(500).json({ error: 'Failed to fetch Barry List issues' });
        }
    });

    // Get excluded items with pagination
    router.get('/excluded-items', async (req, res) => {
        try {
            const pool = await sql.connect(dbConfig);
            const { page = 1, pageSize = 25, searchTerm = '', exclusionReason = '', system = '' } = req.query;
            const offset = (page - 1) * pageSize;

            let whereClause = 'WHERE 1=1';

            if (searchTerm) {
                whereClause += ` AND (SKU LIKE '%${searchTerm}%' OR UPC LIKE '%${searchTerm}%')`;
            }

            if (exclusionReason) {
                whereClause += ` AND Exclusion_Reason = '${exclusionReason}'`;
            }

            if (system) {
                whereClause += ` AND Has_Unmatched_${system}_UPCs = 'Yes'`;
            }

            // Get total count
            const countResult = await pool.request()
                .query(`SELECT COUNT(*) as total FROM vw_Dimensioner_Excluded_Items ${whereClause}`);

            // Get paginated data
            const dataResult = await pool.request()
                .query(`
            SELECT *
            FROM vw_Dimensioner_Excluded_Items
            ${whereClause}
            ORDER BY SKU, Level
            OFFSET ${offset} ROWS
            FETCH NEXT ${pageSize} ROWS ONLY
          `);

            res.json({
                data: dataResult.recordset,
                totalCount: countResult.recordset[0].total
            });
        } catch (error) {
            console.error('Excluded items error:', error);
            res.status(500).json({ error: 'Failed to fetch excluded items' });
        }
    });

    // Export functionality
    router.get('/export/:type', async (req, res) => {
        try {
            const pool = await sql.connect(dbConfig);
            const { type } = req.params;
            const { searchTerm = '', issueType = '', exclusionReason = '', system = '' } = req.query;

            let query = '';
            let whereClause = '';

            switch (type) {
                case 'barry':
                    whereClause = 'WHERE has_issue = 1';
                    if (searchTerm) {
                        whereClause += ` AND (ItemCode LIKE '%${searchTerm}%' OR UPC LIKE '%${searchTerm}%')`;
                    }
                    query = `SELECT * FROM vw_Barry_List_Issues ${whereClause}`;
                    break;
                case 'excluded':
                    whereClause = 'WHERE 1=1';
                    if (searchTerm) {
                        whereClause += ` AND (SKU LIKE '%${searchTerm}%' OR UPC LIKE '%${searchTerm}%')`;
                    }
                    query = `SELECT * FROM vw_Dimensioner_Excluded_Items ${whereClause}`;
                    break;
                default:
                    return res.status(400).json({ error: 'Invalid export type' });
            }

            const result = await pool.request().query(query);

            // Convert to CSV
            const csvHeader = Object.keys(result.recordset[0]).join(',');
            const csvRows = result.recordset.map(row =>
                Object.values(row).map(val =>
                    typeof val === 'string' && val.includes(',') ? `"${val}"` : val
                ).join(',')
            );
            const csv = [csvHeader, ...csvRows].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${type}-export.csv"`);
            res.send(csv);
        } catch (error) {
            console.error('Export error:', error);
            res.status(500).json({ error: 'Failed to export data' });
        }
    });

    // IMPORTANT: Return the router
    return router;
};
