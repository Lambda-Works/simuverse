-- Pre-migration validation: ensure no orphan roles before adding FK constraints
-- Run this BEFORE applying the migration to verify data integrity

-- 1. Check for users with roles that don't exist in the roles table
SELECT u.id, u.email, u.role
FROM users u
LEFT JOIN roles r ON u.role = r.name
WHERE r.name IS NULL;

-- 2. Check for role_permissions referencing non-existent roles
SELECT rp.id, rp.role_name
FROM role_permissions rp
LEFT JOIN roles r ON rp.role_name = r.name
WHERE r.name IS NULL;

-- 3. Check for role_permissions referencing non-existent functionalities
SELECT rp.id, rp.functionality_id
FROM role_permissions rp
LEFT JOIN system_functionalities sf ON rp.functionality_id = sf.id
WHERE sf.id IS NULL;

-- If any of the above queries return rows, fix the data before running migration.
