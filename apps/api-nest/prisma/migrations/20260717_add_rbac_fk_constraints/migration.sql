-- Add RBAC FK constraints for referential integrity
-- Pre-migration: validate no orphan data (run validate-rbac-data.sql first)

-- 1. Add unique constraint on roles.name (required for FK target)
ALTER TABLE "roles" ADD CONSTRAINT "roles_name_key" UNIQUE ("name");

-- 2. Add FK: users.role → roles.name
ALTER TABLE "users" ADD CONSTRAINT "users_role_fkey"
  FOREIGN KEY ("role") REFERENCES "roles"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3. Add FK: role_permissions.role_name → roles.name
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_name_fkey"
  FOREIGN KEY ("role_name") REFERENCES "roles"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. Add FK: role_permissions.functionality_id → system_functionalities.id
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_functionality_id_fkey"
  FOREIGN KEY ("functionality_id") REFERENCES "system_functionalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
