-- Quick Test for Fresh SQL Import
-- Run this to test a small batch first

-- Test with first 10 records only
SELECT TOP 10 * FROM (
    
('Dynarex', '1108', 'Povidone - Iodine USP Prep Pads', 'Antiseptic', '0.9g', '1/EA', '100/BX', '100 x 10/CS', NULL, NULL
) as test_data;

-- If this succeeds, proceed with full import
