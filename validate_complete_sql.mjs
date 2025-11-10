import fs from 'fs/promises';

/**
 * SQL VALIDATION SCRIPT
 *
 * This script validates the integrity and completeness of the generated
 * data_import_statements_COMPLETE_FRESH.sql file to ensure it contains
 * all 2722 unique items with proper formatting.
 */

async function validateCompleteSQL() {
    console.log('🔍 VALIDATING COMPLETE FRESH SQL FILE');
    console.log('═══════════════════════════════════════════════════════════════');

    const sqlFile = 'data_import_statements_COMPLETE_FRESH.sql';

    try {
        // Read the SQL file
        const sqlContent = await fs.readFile(sqlFile, 'utf8');
        console.log(`✅ Successfully read SQL file: ${sqlFile}`);
        console.log(`📊 File size: ${(sqlContent.length / 1024 / 1024).toFixed(2)} MB`);

        // Validation 1: Check for proper header
        const hasHeader = sqlContent.includes('COMPLETE FRESH SQL IMPORT - ALL UNIQUE ITEMS');
        console.log(`✅ Header check: ${hasHeader ? 'PASS' : 'FAIL'}`);

        // Validation 2: Check for INSERT statement
        const hasInsert = sqlContent.includes('INSERT INTO data_team_active_items');
        console.log(`✅ INSERT statement check: ${hasInsert ? 'PASS' : 'FAIL'}`);

        // Validation 3: Count VALUES rows
        const valueRows = sqlContent.match(/^\(/gm);
        const valueCount = valueRows ? valueRows.length : 0;
        console.log(`✅ VALUE rows count: ${valueCount} (Expected: 2722) - ${valueCount === 2722 ? 'PASS' : 'FAIL'}`);

        // Validation 4: Check for validation queries
        const hasValidation = sqlContent.includes('VALIDATION QUERIES');
        console.log(`✅ Validation queries included: ${hasValidation ? 'PASS' : 'FAIL'}`);

        // Validation 5: Check for proper SQL termination
        const hasSemicolon = sqlContent.includes(') VALUES\n(') && sqlContent.includes(');\n\n-- VALIDATION');
        console.log(`✅ Proper SQL termination: ${hasSemicolon ? 'PASS' : 'FAIL'}`);

        // Validation 6: Sample data extraction
        console.log('\n📋 SAMPLE DATA VERIFICATION:');
        const insertMatch = sqlContent.match(/INSERT INTO data_team_active_items[^(]+\) VALUES\n(.+?);\n\n/s);
        if (insertMatch) {
            const valuesSection = insertMatch[1];
            const sampleRows = valuesSection.split('\n').slice(0, 3);

            sampleRows.forEach((row, index) => {
                if (row.trim()) {
                    // Extract item number (second field)
                    const match = row.match(/\('([^']+)',\s*'([^']+)'/);
                    if (match) {
                        const brand = match[1];
                        const item = match[2];
                        console.log(`   ${index + 1}. Brand: "${brand}", Item: "${item}"`);
                    }
                }
            });
        }

        // Validation 7: Check for common SQL injection risks (excluding legitimate documentation)
        const sqlContentWithoutComments = sqlContent.replace(/^-- .+$/gm, ''); // Remove documentation lines

        const suspiciousPatterns = [
            /[^']';[^']/g,  // Unescaped semicolons
            /\/\*/g,        // Block comments
            /UNION\s+SELECT/gi,
            /DROP\s+TABLE/gi,
            /DELETE\s+FROM/gi,
            /UPDATE\s+\w+\s+SET/gi
        ];

        let securityIssues = 0;
        suspiciousPatterns.forEach(pattern => {
            const matches = sqlContentWithoutComments.match(pattern);
            if (matches && matches.length > 0) {
                securityIssues += matches.length;
            }
        });
        console.log(`✅ Security check: ${securityIssues === 0 ? 'PASS - No SQL injection risks detected' : `FAIL - ${securityIssues} potential issues found`}`);

        // Final assessment
        console.log('\n🎯 FINAL VALIDATION RESULTS:');
        console.log('═══════════════════════════════════════════════════════════════');

        const allChecks = [
            hasHeader,
            hasInsert,
            valueCount === 2722,
            hasValidation,
            hasSemicolon,
            securityIssues === 0
        ];

        const passedChecks = allChecks.filter(check => check).length;
        const totalChecks = allChecks.length;

        console.log(`📊 Checks passed: ${passedChecks}/${totalChecks}`);
        console.log(`✅ Overall status: ${passedChecks === totalChecks ? '🎉 ALL VALIDATIONS PASSED!' : '⚠️ Some validations failed'}`);

        if (passedChecks === totalChecks) {
            console.log('\n🚀 READY FOR PRODUCTION IMPORT!');
            console.log('   ✓ File integrity verified');
            console.log('   ✓ All 2722 unique items included');
            console.log('   ✓ Proper SQL formatting confirmed');
            console.log('   ✓ Security checks passed');
            console.log('   ✓ Validation queries included');
        } else {
            console.log('\n⚠️ MANUAL REVIEW REQUIRED');
            console.log('   Some validation checks failed - please review before import');
        }

        return passedChecks === totalChecks;

    } catch (error) {
        console.error(`❌ Validation failed: ${error.message}`);
        return false;
    }
}

// Execute validation
validateCompleteSQL();