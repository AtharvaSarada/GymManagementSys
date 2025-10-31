# Fix for "Become a Member" Functionality

## Issues Fixed

1. **Foreign Key Constraint Error**: Users couldn't create member records due to restrictive RLS policies
2. **Bill Creation RLS Error**: Users couldn't create bills due to admin-only RLS policies

## Solution

Run the SQL script `fix_become_member_rls.sql` in your Supabase SQL Editor.

### Steps:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database/fix_become_member_rls.sql`
4. Click "Run" to execute the SQL

### What the fix does:

- **Allows users to create their own member records** when upgrading from USER to MEMBER
- **Allows users to create bills for their own memberships** during the upgrade process
- **Maintains admin privileges** for all operations
- **Ensures proper security** by only allowing users to create records for themselves

### Policies Added/Updated:

1. `Users can insert own member record` - Allows users to create member records for themselves
2. `Users can insert own bills` - Allows users to create bills for their own member records
3. `Users can view own bills` - Allows users to view their own bills
4. `Users can update own profile` - Allows users to update their role when becoming members
5. `Allow user registration` - Ensures new user registration works properly

After applying this fix, the "Become a Member" functionality should work without errors.