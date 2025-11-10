import fs from 'fs/promises';

async function fixInsertStatements() {
    try {
        console.log('📖 Reading original data_import_statements.sql...');
        const originalSQL = await fs.readFile('data_import_statements.sql', 'utf8');

        console.log('🔧 Applying column name fixes...');

        // Fix the INSERT column names to match the existing table schema
        let fixedSQL = originalSQL;

        // Column mapping fixes (old_name -> new_name)
        const columnMappings = {
            'inner_2': 'upc_inner_2',
            'inner_1': 'upc_inner_1',
            'sellable': 'upc_sellable',
            'ship_1': 'upc_ship_1',
            'ship_2': 'upc_ship_2',
            'artwork_inner_2': 'ar_inner_2',
            'artwork_inner_1': 'ar_inner_1',
            'uom_sellable_2': 'ar_sellable',
            'uom_ship_1_2': 'ar_ship_1',
            'uom_ship_2_2': 'ar_ship_2',
            'dim_inner2_d': 'dim_in_2_d',
            'dim_inner2_h': 'dim_in_2_h',
            'dim_inner2_w': 'dim_in_2_w',
            'dim_inner1_d': 'dim_in_1_d',
            'dim_inner1_h': 'dim_in_1_h',
            'dim_inner1_w': 'dim_in_1_w',
            'uom_d': 'dim_sl_d',
            'uom_h': 'dim_sl_h',
            'uom_w': 'dim_sl_w',
            'dim_ship1_d': 'dim_ship_1_d',
            'dim_ship1_h': 'dim_ship_1_h',
            'dim_ship1_w': 'dim_ship_1_w',
            'dim_ship2_d': 'dim_ship_2_d',
            'dim_ship2_h': 'dim_ship_2_h',
            'dim_ship2_w': 'dim_ship_2_w',
            'reg_product_type': 'product_type',
            'reg_fei': 'fei_number',
            'reg_dln': 'dln',
            'reg_device_class': 'device_class',
            'reg_product_code': 'product_code',
            'reg_510_k': 'fda_510_k',
            'reg_exp_date': 'exp_date',
            'reg_sn': 'sn_number',
            'reg_sterile': 'sterile',
            'reg_sterile_method': 'sterile_method',
            'reg_shelf_life': 'shelf_life'
        };

        // Apply each mapping
        for (const [oldName, newName] of Object.entries(columnMappings)) {
            // Use word boundaries to ensure exact matches
            const regex = new RegExp(`\\b${oldName}\\b`, 'g');
            fixedSQL = fixedSQL.replace(regex, newName);
            console.log(`✅ Replaced ${oldName} → ${newName}`);
        }

        // Write the corrected SQL file
        const outputFile = 'data_import_statements_FIXED.sql';
        await fs.writeFile(outputFile, fixedSQL);

        console.log(`\n🎉 Fixed INSERT statements saved to: ${outputFile}`);

        // Count the number of INSERT statements
        const insertCount = (fixedSQL.match(/INSERT INTO/g) || []).length;
        console.log(`📊 Total INSERT statements: ${insertCount}`);

        // Show a sample of the fixed INSERT statement
        const lines = fixedSQL.split('\n');
        const insertLineIndex = lines.findIndex(line => line.includes('INSERT INTO'));
        if (insertLineIndex >= 0) {
            console.log('\n📋 Sample of fixed INSERT statement:');
            console.log('─'.repeat(80));
            for (let i = insertLineIndex; i < Math.min(insertLineIndex + 20, lines.length); i++) {
                console.log(lines[i]);
            }
        }

        return outputFile;
    } catch (error) {
        console.error('❌ Error fixing INSERT statements:', error.message);
        throw error;
    }
}

fixInsertStatements();