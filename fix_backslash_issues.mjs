import fs from 'fs/promises';

async function fixBackslashIssues() {
    try {
        console.log('🔧 Fixing backslash escape issues...');

        // Read the current fixed SQL file
        const sqlContent = await fs.readFile('data_import_statements_FIXED.sql', 'utf8');

        console.log('🔍 Analyzing backslash patterns...');

        // Show examples of problematic data before fixing
        const lines = sqlContent.split('\n');
        let exampleCount = 0;
        console.log('\n📋 Examples of problematic data (before fixing):');
        for (const line of lines) {
            if (line.includes('\\') && !line.includes('\\\\') && exampleCount < 5) {
                const match = line.match(/'[^']*\\[^']*'/);
                if (match) {
                    console.log(`  ${exampleCount + 1}. ${match[0]}`);
                    exampleCount++;
                }
            }
        }

        // Fix the backslash issues
        console.log('\n🔧 Applying fixes...');
        let fixedSQL = sqlContent;

        // Replace single backslashes with double backslashes, but only within quoted strings
        // This regex finds quoted strings and replaces \ with \\ inside them
        fixedSQL = fixedSQL.replace(/'([^']*)'/g, (match, content) => {
            // Only fix if it contains single backslashes that aren't already escaped
            if (content.includes('\\') && !content.includes('\\\\')) {
                const fixed = content.replace(/\\/g, '\\\\');
                console.log(`  ✅ Fixed: '${content}' → '${fixed}'`);
                return `'${fixed}'`;
            }
            return match;
        });

        // Count the fixes made
        const originalBackslashCount = (sqlContent.match(/'/g) || []).length;
        const fixedBackslashCount = (fixedSQL.match(/'/g) || []).length;

        console.log(`\n📊 Fix Summary:`);
        console.log(`  🔍 Original quotes found: ${originalBackslashCount}`);
        console.log(`  🔧 After fixing: ${fixedBackslashCount}`);

        // Show examples after fixing
        console.log('\n📋 Examples after fixing:');
        const fixedLines = fixedSQL.split('\n');
        exampleCount = 0;
        for (const line of fixedLines) {
            if (line.includes('\\\\') && exampleCount < 5) {
                const match = line.match(/'[^']*\\\\[^']*'/);
                if (match) {
                    console.log(`  ${exampleCount + 1}. ${match[0]}`);
                    exampleCount++;
                }
            }
        }

        // Write the corrected SQL file
        const outputFile = 'data_import_statements_BACKSLASH_FIXED.sql';
        await fs.writeFile(outputFile, fixedSQL);

        console.log(`\n🎉 Backslash fixes completed!`);
        console.log(`📁 Fixed file saved as: ${outputFile}`);

        // Verify the fix by checking for remaining single backslashes
        const remainingIssues = (fixedSQL.match(/'[^']*[^\\]\\[^\\][^']*'/g) || []).length;
        console.log(`🔍 Remaining potential backslash issues: ${remainingIssues}`);

        if (remainingIssues === 0) {
            console.log('✅ All backslash issues appear to be resolved!');
        } else {
            console.log('⚠️  Some complex backslash patterns may still need manual review');
        }

        return outputFile;

    } catch (error) {
        console.error('❌ Error fixing backslash issues:', error.message);
        throw error;
    }
}

fixBackslashIssues();