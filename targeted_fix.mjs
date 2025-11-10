import fs from 'fs/promises';

async function targetedFix() {
    try {
        console.log('🎯 Applying targeted fixes to the working version...');

        // Start with the QUOTES_FIXED version that worked at 94.5%
        const sqlContent = await fs.readFile('data_import_statements_QUOTES_FIXED.sql', 'utf8');

        console.log('📏 Applying ONLY text truncation fixes...');
        let fixedSQL = sqlContent;
        let truncationCount = 0;

        // Only fix the specific long product names that caused truncation errors
        const truncationFixes = [
            {
                search: "'DynaFit Graduated Compression Anti-Embolism Stockings'",
                replace: "'DynaFit Graduated Compression Anti-Embolism Stck'"
            },
            {
                search: "'Surgical Hand Scrub & Preoperative Skin Preparation'",
                replace: "'Surgical Hand Scrub & Preoperative Skin Prep'"
            }
        ];

        for (const fix of truncationFixes) {
            const beforeCount = (fixedSQL.match(new RegExp(fix.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
            fixedSQL = fixedSQL.replace(new RegExp(fix.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.replace);
            const afterCount = (fixedSQL.match(new RegExp(fix.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
            const fixed = beforeCount - afterCount;
            if (fixed > 0) {
                console.log(`  ✂️ Truncated ${fixed} instances: ${fix.search} → ${fix.replace}`);
                truncationCount += fixed;
            }
        }

        // NO backslash fixes - the working version already handled the important ones
        console.log('⚠️  Skipping aggressive backslash fixes to preserve working quotes');

        console.log(`\n📊 Conservative Fix Summary:`);
        console.log(`  ✂️ Text truncations only: ${truncationCount}`);
        console.log(`  🎯 Strategy: Minimal changes to preserve 94.5% success rate`);

        // Write the conservatively fixed SQL file
        const outputFile = 'data_import_statements_CONSERVATIVE.sql';
        await fs.writeFile(outputFile, fixedSQL);

        console.log(`\n🎉 Conservative fixes applied!`);
        console.log(`📁 File saved as: ${outputFile}`);
        console.log(`🎯 Expected outcome: ~98-99% success rate`);

        return outputFile;

    } catch (error) {
        console.error('❌ Error with targeted fix:', error.message);
        throw error;
    }
}

targetedFix();