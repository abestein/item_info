-- Fix admin password hash
UPDATE Users
SET PasswordHash = '$2b$10$lp2az2rIfJ5BoeKTR9qHHOybmfhLu8ivWzpbI5pHc1.t8w1r8l4Jm'
WHERE Username = 'admin';

-- Verify the update
SELECT Username, LEN(PasswordHash) as HashLength, PasswordHash
FROM Users
WHERE Username = 'admin';