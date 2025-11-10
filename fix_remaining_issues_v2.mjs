import fs from 'fs/promises';

async function fixRemainingIssues() {
    try {
        console.log('🔧 Fixing remaining 150 records for 100% success...');

        // Read the quotes-fixed SQL file
        const sqlContent = await fs.readFile('data_import_statements_QUOTES_FIXED.sql', 'utf8');

        console.log('🔍 Applying comprehensive fixes...');
        let fixedSQL = sqlContent;

        // Fix 1: Truncate long text fields to fit column limits
        console.log('\n📏 Fix 1: Truncating long text fields...');

        let truncationCount = 0;

        // Fix the specific long product names we know about
        const longNameFixes = [
            {
                original: 'DynaFit Graduated Compression Anti-Embolism Stockings',
                fixed: 'DynaFit Graduated Compression Anti-Embolism Stck'  // 50 chars
            },
            {
                original: 'Surgical Hand Scrub & Preoperative Skin Preparation',
                fixed: 'Surgical Hand Scrub & Preoperative Skin Prep'  // 46 chars
            }
        ];

        for (const fix of longNameFixes) {
            const regex = new RegExp(`'${fix.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`, 'g');
            const beforeCount = (fixedSQL.match(regex) || []).length;
            fixedSQL = fixedSQL.replace(regex, `'${fix.fixed}'`);
            const afterCount = (fixedSQL.match(regex) || []).length;
            const fixed = beforeCount - afterCount;
            if (fixed > 0) {
                console.log(`  ✂️ Truncated "${fix.original}" → "${fix.fixed}" (${fixed} instances)`);
                truncationCount += fixed;
            }
        }

        // Fix 2: Handle remaining backslash issues
        console.log('\n🔧 Fix 2: Escaping remaining backslashes...');

        let backslashCount = 0;

        // Look for patterns that might have actual backslashes
        // This is more careful to avoid breaking our already-fixed \" patterns
        fixedSQL = fixedSQL.replace(/'([^']*)'/g, (match, content) => {
            // Only fix if it has backslashes that aren't already properly escaped
            if (content.includes('\\') && !content.includes('\\"')) {
                // Look for single backslashes not followed by a quote
                if (/\\(?![\\"])/.test(content)) {
                    const fixed = content.replace(/\\(?![\\"])/g, '\\\\');
                    console.log(`  🔧 Fixed backslash: '${content}' → '${fixed}'`);
                    backslashCount++;
                    return `'${fixed}'`;
                }
            }
            return match;
        });

        // Fix 3: Handle any other problematic characters
        console.log('\n🔤 Fix 3: Normalizing special characters...');

        let specialCharCount = 0;

        // Replace problematic Unicode characters with ASCII equivalents
        const charMappings = [
            [/"/g, '\\"'],     // Left double quote
            [/"/g, '\\"'],     // Right double quote
            [/'/g, "\\'"],     // Left single quote
            [/'/g, "\\'"],     // Right single quote
            [/–/g, '-'],       // En dash
            [/—/g, '-'],       // Em dash
            [/…/g, '...'],     // Ellipsis
            [/™/g, 'TM'],      // Trademark
            [/®/g, '(R)'],     // Registered trademark
            [/©/g, '(C)'],     // Copyright
        ];

        for (const [regex, replacement] of charMappings) {
            const beforeLength = fixedSQL.length;
            fixedSQL = fixedSQL.replace(regex, replacement);
            if (fixedSQL.length !== beforeLength) {
                specialCharCount++;
            }
        }

        console.log(`\n📊 Fix Summary:`);
        console.log(`  ✂️ Text truncations: ${truncationCount}`);
        console.log(`  🔧 Backslash fixes: ${backslashCount}`);
        console.log(`  🔤 Special character normalizations: ${specialCharCount}`);

        // Write the final corrected SQL file
        const outputFile = 'data_import_statements_FINAL.sql';
        await fs.writeFile(outputFile, fixedSQL);

        console.log(`\n🎉 All fixes completed!`);
        console.log(`📁 Final fixed file saved as: ${outputFile}`);

        return outputFile;

    } catch (error) {
        console.error('❌ Error fixing remaining issues:', error.message);
        throw error;
    }
}

fixRemainingIssues();