import fs from 'fs/promises';

async function fixRemainingIssues() {
    try {
        console.log('🔧 Fixing remaining 150 records for 100% success...');

        // Read the quotes-fixed SQL file
        const sqlContent = await fs.readFile('data_import_statements_QUOTES_FIXED.sql', 'utf8');

        console.log('🔍 Applying comprehensive fixes...');
        let fixedSQL = sqlContent;
        let fixCount = 0;

        // Fix 1: Handle remaining backslash issues (actual backslashes, not inch marks)
        console.log('\n📝 Fix 1: Escaping remaining backslashes...');

        // Look for actual backslashes that aren't already escaped
        const backslashMatches = fixedSQL.match(/'[^']*[^\\]\\[^\\"][^']*'/g);
        if (backslashMatches) {
            console.log(`Found ${backslashMatches.length} potential backslash issues`);

            // Fix actual backslashes (not the \" we already fixed)
            fixedSQL = fixedSQL.replace(/'([^']*)'/g, (match, content) => {
                // Only fix single backslashes that aren't part of \"
                if (content.includes('\\') && !content.includes('\\"')) {
                    // Check if it contains single backslashes not followed by "
                    const hasUnescapedBackslash = /\\(?!")/.test(content);
                    if (hasUnescapedBackslash) {
                        const fixed = content.replace(/\\(?!")/g, '\\\\');
                        console.log(`  ✅ Fixed backslash: '${content}' → '${fixed}'`);
                        fixCount++;
                        return `'${fixed}'`;
                    }
                }
                return match;
            });
        }

        // Fix 2: Truncate long text fields to fit column limits
        console.log('\n📏 Fix 2: Truncating long text fields...');

        // Split into individual INSERT statements for processing
        const insertStatements = fixedSQL.split(/INSERT INTO data_team_active_items/g);
        let truncationCount = 0;

        for (let i = 1; i < insertStatements.length; i++) {
            let statement = 'INSERT INTO data_team_active_items' + insertStatements[i];

            // Extract VALUES section
            const valuesMatch = statement.match(/VALUES\s*\((.*?)\);?$/s);
            if (valuesMatch) {
                const valuesContent = valuesMatch[1];
                const values = [];
                let currentValue = '';
                let inQuotes = false;
                let quoteChar = '';

                // Parse values more carefully
                for (let j = 0; j < valuesContent.length; j++) {
                    const char = valuesContent[j];
                    const nextChar = valuesContent[j + 1];

                    if (!inQuotes && (char === "'" || char === '"')) {
                        inQuotes = true;
                        quoteChar = char;
                        currentValue += char;
                    } else if (inQuotes && char === quoteChar && nextChar !== quoteChar) {
                        inQuotes = false;
                        currentValue += char;
                    } else if (!inQuotes && char === ',') {
                        values.push(currentValue.trim());
                        currentValue = '';
                    } else {
                        currentValue += char;
                    }
                }
                if (currentValue.trim()) {
                    values.push(currentValue.trim());
                }

                // Fix specific field lengths based on table schema
                let modified = false;

                // Field mappings based on INSERT column order
                const fieldLimits = {
                    2: 50,   // brand_name
                    3: 50,   // item
                    4: 50,   // description1
                    5: 100,  // description2
                    6: 50,   // description3
                };

                for (const [fieldIndex, limit] of Object.entries(fieldLimits)) {
                    const idx = parseInt(fieldIndex);
                    if (values[idx] && values[idx].startsWith("'") && values[idx].endsWith("'")) {
                        const content = values[idx].slice(1, -1); // Remove quotes
                        if (content.length > limit) {
                            const truncated = content.substring(0, limit - 3) + '...';
                            values[idx] = `'${truncated}'`;
                            console.log(`  ✂️ Truncated field ${idx}: "${content}" → "${truncated}"`);
                            modified = true;
                            truncationCount++;
                        }
                    }
                }

                if (modified) {
                    const newValues = values.join(', ');
                    statement = statement.replace(/VALUES\s*\(.*?\);?$/s, `VALUES (${newValues});`);
                    insertStatements[i] = statement.replace('INSERT INTO data_team_active_items', '');
                }
            }
        }

        // Rebuild the SQL
        fixedSQL = insertStatements.join('INSERT INTO data_team_active_items');

        // Fix 3: Handle any remaining special characters
        console.log('\n🔤 Fix 3: Handling special characters...');

        // Fix any remaining problematic characters
        let specialCharCount = 0;
        fixedSQL = fixedSQL.replace(/'([^']*)'/g, (match, content) => {
            let fixed = content;
            let hasChanges = false;

            // Fix smart quotes and other problematic characters
            const charReplacements = {
                '"': '\\"',   // Left double quote
                '"': '\\"',   // Right double quote
                ''': "\\'",   // Left single quote
                ''': "\\'",   // Right single quote
                '–': '-',     // En dash
                '—': '-',     // Em dash
                '…': '...',   // Ellipsis
            };

            for (const [char, replacement] of Object.entries(charReplacements)) {
                if (fixed.includes(char)) {
                    fixed = fixed.replace(new RegExp(char, 'g'), replacement);
                    hasChanges = true;
                }
            }

            if (hasChanges) {
                console.log(`  🔤 Fixed special chars: '${content}' → '${fixed}'`);
                specialCharCount++;
                return `'${fixed}'`;
            }
            return match;
        });

        console.log(`\n📊 Fix Summary:`);
        console.log(`  🔧 Backslash fixes: ${fixCount}`);
        console.log(`  ✂️ Text truncations: ${truncationCount}`);
        console.log(`  🔤 Special character fixes: ${specialCharCount}`);

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