import fs from 'fs/promises';

async function preciseFix() {
    try {
        console.log('🎯 Creating precise fix for the remaining 142 failed records...');

        // Start with the conservative version
        const sqlContent = await fs.readFile('data_import_statements_CONSERVATIVE.sql', 'utf8');

        console.log('📏 Fixing specific truncation issues...');
        let fixedSQL = sqlContent;
        let truncationCount = 0;

        // Fix the specific long description that's still causing issues
        const specificFixes = [
            {
                search: "'Double Sided Slipper Socks, Non-Skid Tread, Terry'",
                replace: "'Double Sided Slipper Socks, Non-Skid Tread, Ter'"
            },
            {
                search: "'Blue Metal Detectable Woven Fingertip Bandages'",
                replace: "'Blue Metal Detectable Woven Fingertip Bandages'" // Check if this needs truncation
            }
        ];

        // Apply specific truncation fixes
        for (const fix of specificFixes) {
            if (fix.search.length - 2 > 50) { // -2 for quotes
                const content = fix.search.slice(1, -1); // Remove quotes
                const truncated = content.substring(0, 47) + '...';
                const newReplace = `'${truncated}'`;

                const beforeCount = (fixedSQL.match(new RegExp(fix.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
                fixedSQL = fixedSQL.replace(new RegExp(fix.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newReplace);
                const afterCount = (fixedSQL.match(new RegExp(fix.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
                const fixed = beforeCount - afterCount;

                if (fixed > 0) {
                    console.log(`  ✂️ Truncated ${fixed} instances: ${fix.search} → ${newReplace}`);
                    truncationCount += fixed;
                }
            }
        }

        // Fix remaining backslash issues more precisely
        console.log('🔧 Fixing remaining backslash syntax issues...');
        let backslashCount = 0;

        // More precise pattern for fixing backslashes in dimension values
        // Look for patterns like 1\" or 2\" that should be 1" or 2"
        fixedSQL = fixedSQL.replace(/'([^']*?)\\+"([^']*?)'/g, (match, before, after) => {
            // Only fix if it looks like a dimension (number followed by inch mark)
            if (/\d\s*$/.test(before) && /^\s*/.test(after)) {
                console.log(`  🔧 Fixed backslash: '${before}\\"${after}' → '${before}"${after}'`);
                backslashCount++;
                return `'${before}"${after}'`;
            }
            return match;
        });

        // Find and fix any remaining long strings more precisely
        console.log('🔍 Scanning for remaining long descriptions...');
        const lines = fixedSQL.split('\n');
        let autoTruncationCount = 0;

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes("INSERT INTO") || lines[i].includes("VALUES")) {
                continue; // Skip SQL structure lines
            }

            // Look for quoted strings longer than 50 characters in data rows only
            if (lines[i].trim().startsWith('(') && lines[i].includes("'")) {
                lines[i] = lines[i].replace(/'([^']{51,})'/g, (match, content) => {
                    // Only truncate if it's clearly a description (has spaces and common words)
                    if (content.includes(' ') &&
                        (content.includes('and') || content.includes('with') ||
                         content.includes('for') || content.includes('Anti') ||
                         content.includes('Compression'))) {
                        const truncated = content.substring(0, 47) + '...';
                        console.log(`  ✂️ Auto-truncated: "${content}" → "${truncated}"`);
                        autoTruncationCount++;
                        return `'${truncated}'`;
                    }
                    return match;
                });
            }
        }

        fixedSQL = lines.join('\n');

        console.log(`\n📊 Precise Fix Summary:`);
        console.log(`  ✂️ Specific truncations: ${truncationCount}`);
        console.log(`  🔧 Backslash fixes: ${backslashCount}`);
        console.log(`  🎯 Auto truncations: ${autoTruncationCount}`);
        console.log(`  📈 Expected improvement: ~${truncationCount + backslashCount + autoTruncationCount} more records`);

        // Write the precisely fixed SQL file
        const outputFile = 'data_import_statements_PRECISE.sql';
        await fs.writeFile(outputFile, fixedSQL);

        console.log(`\n🎉 Precise fixes applied!`);
        console.log(`📁 File saved as: ${outputFile}`);
        console.log(`🎯 Target: Get closer to 100% success rate`);

        return outputFile;

    } catch (error) {
        console.error('❌ Error with precise fix:', error.message);
        throw error;
    }
}

preciseFix();