import fs from 'fs/promises';

async function fixQuoteIssues() {
    try {
        console.log('🔧 Fixing double quote issues in SQL strings...');

        // Read the current fixed SQL file
        const sqlContent = await fs.readFile('data_import_statements_FIXED.sql', 'utf8');

        console.log('🔍 Analyzing quote patterns...');

        // Find examples of problematic patterns
        const problematicPatterns = [];
        const lines = sqlContent.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Look for single quotes containing double quotes (inch marks)
            const matches = line.match(/'[^']*"[^']*'/g);
            if (matches) {
                matches.forEach(match => {
                    if (problematicPatterns.length < 10) {
                        problematicPatterns.push({
                            line: i + 1,
                            pattern: match
                        });
                    }
                });
            }
        }

        console.log('\n📋 Examples of problematic patterns (inch marks in quotes):');
        problematicPatterns.forEach((item, index) => {
            console.log(`  ${index + 1}. Line ${item.line}: ${item.pattern}`);
        });

        // Fix the quote issues
        console.log('\n🔧 Applying fixes...');
        let fixedSQL = sqlContent;
        let fixCount = 0;

        // Replace double quotes with escaped double quotes within single-quoted strings
        fixedSQL = fixedSQL.replace(/'([^']*)'/g, (match, content) => {
            if (content.includes('"')) {
                const fixed = content.replace(/"/g, '\\"');
                console.log(`  ✅ Fixed: '${content}' → '${fixed}'`);
                fixCount++;
                return `'${fixed}'`;
            }
            return match;
        });

        console.log(`\n📊 Fix Summary:`);
        console.log(`  🔧 Fixed ${fixCount} quoted strings containing inch marks`);

        // Write the corrected SQL file
        const outputFile = 'data_import_statements_QUOTES_FIXED.sql';
        await fs.writeFile(outputFile, fixedSQL);

        console.log(`\n🎉 Quote fixes completed!`);
        console.log(`📁 Fixed file saved as: ${outputFile}`);

        // Show examples after fixing
        console.log('\n📋 Examples after fixing:');
        const fixedLines = fixedSQL.split('\n');
        let exampleCount = 0;

        for (const line of fixedLines) {
            const matches = line.match(/'[^']*\\"[^']*'/g);
            if (matches && exampleCount < 5) {
                matches.forEach(match => {
                    if (exampleCount < 5) {
                        console.log(`  ${exampleCount + 1}. ${match}`);
                        exampleCount++;
                    }
                });
            }
        }

        return outputFile;

    } catch (error) {
        console.error('❌ Error fixing quote issues:', error.message);
        throw error;
    }
}

fixQuoteIssues();