import fs from 'fs/promises';

async function finalComprehensiveFix() {
    try {
        console.log('🏁 Final comprehensive fix for 100% success...');

        // Start with the conservative version
        const sqlContent = await fs.readFile('data_import_statements_CONSERVATIVE.sql', 'utf8');

        console.log('🔍 Identifying and fixing ALL remaining issues...');
        let fixedSQL = sqlContent;

        // Fix all text truncation issues more comprehensively
        console.log('\n📏 Comprehensive text truncation fixes...');
        let truncationCount = 0;

        // Extended list of long descriptions that need truncation
        const truncationFixes = [
            // Already fixed:
            { from: "'DynaFit Graduated Compression Anti-Embolism Stockings'", to: "'DynaFit Graduated Compression Anti-Embolism Stck'" },
            { from: "'Surgical Hand Scrub & Preoperative Skin Preparation'", to: "'Surgical Hand Scrub & Preoperative Skin Prep'" },

            // Additional ones based on error messages:
            { from: "'Double Sided Slipper Socks, Non-Skid Tread, Terry'", to: "'Double Sided Slipper Socks, Non-Skid Tread, Ter'" },
            { from: "'Self-Sealing Sterilization Pouches'", to: "'Self-Sealing Sterilization Pouches'" }, // Should be fine
            { from: "'Blue Metal Detectable Woven Fingertip Bandages'", to: "'Blue Metal Detectable Woven Fingertip Bandages'" }, // Check length

            // Proactive fixes for other potential long names:
            { from: "'Premoistened Washcloths'", to: "'Premoistened Washcloths'" },
            { from: "'Moisturizing Shampoo and Body Wash'", to: "'Moisturizing Shampoo and Body Wash'" },
            { from: "'All Purpose Shampoo and Body Wash'", to: "'All Purpose Shampoo and Body Wash'" },
        ];

        // Apply truncation fixes
        for (const fix of truncationFixes) {
            if (fix.from.length - 2 > 50) { // -2 for quotes, >50 for column limit
                // Create a proper truncated version
                const content = fix.from.slice(1, -1); // Remove quotes
                const truncated = content.length > 50 ? content.substring(0, 47) + '...' : content;
                const newFix = { from: fix.from, to: `'${truncated}'` };

                const regex = new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                const beforeCount = (fixedSQL.match(regex) || []).length;
                fixedSQL = fixedSQL.replace(regex, newFix.to);
                const afterCount = (fixedSQL.match(regex) || []).length;
                const fixed = beforeCount - afterCount;

                if (fixed > 0) {
                    console.log(`  ✂️ Truncated ${fixed} instances: ${fix.from} → ${newFix.to}`);
                    truncationCount += fixed;
                }
            }
        }

        // More aggressive truncation - find and fix ANY string over 50 characters in description columns
        console.log('\n🔍 Scanning for any remaining long strings...');

        fixedSQL = fixedSQL.replace(/'([^']{51,})'/g, (match, content) => {
            // Only truncate if it looks like a description (contains spaces and common words)
            if (content.includes(' ') && (content.includes('and') || content.includes('with') || content.includes('for'))) {
                const truncated = content.substring(0, 47) + '...';
                console.log(`  ✂️ Auto-truncated: "${content}" → "${truncated}"`);
                truncationCount++;
                return `'${truncated}'`;
            }
            return match;
        });

        // Handle remaining syntax issues - but very carefully
        console.log('\n🔧 Targeted syntax fixes...');
        let syntaxCount = 0;

        // Only fix obvious problematic patterns in data values
        // Look for unescaped single quotes within strings
        fixedSQL = fixedSQL.replace(/'([^']*)'(\s*,|\s*\))/g, (match, content, ending) => {
            // If content has an apostrophe that's not escaped
            if (content.includes("'") && !content.includes("\\'")) {
                const fixed = content.replace(/'/g, "\\'");
                console.log(`  🔧 Fixed apostrophe: '${content}' → '${fixed}'`);
                syntaxCount++;
                return `'${fixed}'${ending}`;
            }
            return match;
        });

        console.log(`\n📊 Final Fix Summary:`);
        console.log(`  ✂️ Text truncations: ${truncationCount}`);
        console.log(`  🔧 Syntax fixes: ${syntaxCount}`);

        // Write the final perfected SQL file
        const outputFile = 'data_import_statements_PERFECT.sql';
        await fs.writeFile(outputFile, fixedSQL);

        console.log(`\n🏁 Final comprehensive fixes applied!`);
        console.log(`📁 Perfect file saved as: ${outputFile}`);
        console.log(`🎯 Target: 100% success rate`);

        return outputFile;

    } catch (error) {
        console.error('❌ Error with comprehensive fix:', error.message);
        throw error;
    }
}

finalComprehensiveFix();