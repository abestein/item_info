#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function splitSQLImport() {
    console.log('Starting SQL import file splitting...');

    // Read the original SQL file
    const sqlFilePath = 'data_import_statements_COMPLETE_FRESH.sql';
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Split into lines
    const lines = sqlContent.split('\n');

    // Find the INSERT statement start and extract full column list
    let insertStartIndex = -1;
    let insertTable = '';
    let columnLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('INSERT INTO')) {
            insertStartIndex = i;
            insertTable = line;

            // Collect all column lines until we reach ") VALUES"
            for (let j = i + 1; j < lines.length; j++) {
                const columnLine = lines[j].trim();
                columnLines.push(columnLine);
                if (columnLine.endsWith(') VALUES')) {
                    break;
                }
            }
            break;
        }
    }

    if (insertStartIndex === -1) {
        throw new Error('No INSERT statement found in SQL file');
    }

    console.log(`Found INSERT statement at line ${insertStartIndex + 1}`);
    console.log(`Table: ${insertTable}`);
    console.log(`Column lines collected: ${columnLines.length}`);

    // Extract VALUES sections
    const valueLines = [];
    let inValues = false;

    for (let i = insertStartIndex; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.endsWith(') VALUES')) {
            inValues = true;
            continue;
        }

        if (inValues) {
            // Check if this is a data line (starts with parenthesis)
            if (line.startsWith('(') && line.includes(')')) {
                valueLines.push(line);
            } else if (line.startsWith('--') && !line.includes('(')) {
                // End of VALUES section - reached validation queries
                break;
            }
        }
    }

    console.log(`Found ${valueLines.length} data rows to import`);

    // Split into batches of 1000
    const batchSize = 1000;
    const batches = [];

    for (let i = 0; i < valueLines.length; i += batchSize) {
        const batch = valueLines.slice(i, i + batchSize);
        batches.push(batch);
    }

    console.log(`Created ${batches.length} batches`);

    // Create batch files
    const batchFiles = [];

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const batchFileName = `import_batch_${batchIndex + 1}_of_${batches.length}.sql`;

        let batchContent = `-- BATCH ${batchIndex + 1} of ${batches.length}\n`;
        batchContent += `-- Records ${batchIndex * batchSize + 1} to ${Math.min((batchIndex + 1) * batchSize, valueLines.length)}\n\n`;
        batchContent += `${insertTable}\n`;

        // Add all column lines
        for (const columnLine of columnLines) {
            if (columnLine.endsWith(') VALUES')) {
                // Replace ') VALUES' with just ')'
                batchContent += columnLine.replace(') VALUES', ')') + '\n';
                break;
            } else {
                batchContent += columnLine + '\n';
            }
        }
        batchContent += `VALUES\n`;

        // Add all values in this batch
        for (let i = 0; i < batch.length; i++) {
            let valueLine = batch[i];
            // Remove trailing comma if it's the last item in the batch
            if (i === batch.length - 1) {
                valueLine = valueLine.replace(/,$/, '');
            }
            batchContent += `${valueLine}\n`;
        }

        batchContent += `;\n\n`;
        batchContent += `-- Verify batch import\n`;
        batchContent += `SELECT 'Batch ${batchIndex + 1} completed' as status, COUNT(*) as total_records FROM data_team_active_items;\n`;

        fs.writeFileSync(batchFileName, batchContent);
        batchFiles.push(batchFileName);

        console.log(`Created ${batchFileName} with ${batch.length} records`);
    }

    // Create master import script
    const masterScript = `-- MASTER IMPORT SCRIPT FOR ALL BATCHES
-- Total records to import: ${valueLines.length}
-- Number of batches: ${batches.length}

-- Pre-import verification
SELECT 'Starting import' as status, COUNT(*) as current_records FROM data_team_active_items;

-- Import all batches
${batchFiles.map((file, index) => `:r ${file}`).join('\n')}

-- Final verification
SELECT 'Import completed' as status, COUNT(*) as final_records FROM data_team_active_items;
SELECT 'Expected vs Actual' as check_type,
       ${valueLines.length} as expected_records,
       COUNT(*) as actual_records,
       CASE WHEN COUNT(*) = ${valueLines.length}
            THEN 'SUCCESS'
            ELSE 'FAILED'
       END as import_status
FROM data_team_active_items;
`;

    fs.writeFileSync('master_import_script.sql', masterScript);

    console.log('\n=== SPLITTING COMPLETED ===');
    console.log(`Total data rows: ${valueLines.length}`);
    console.log(`Number of batches: ${batches.length}`);
    console.log(`Batch files created: ${batchFiles.join(', ')}`);
    console.log(`Master script: master_import_script.sql`);

    return {
        totalRows: valueLines.length,
        batches: batches.length,
        batchFiles: batchFiles,
        masterScript: 'master_import_script.sql'
    };
}

// Run the splitting
try {
    const result = splitSQLImport();
    console.log('\nSplitting completed successfully!');
    process.exit(0);
} catch (error) {
    console.error('Error during splitting:', error.message);
    process.exit(1);
}