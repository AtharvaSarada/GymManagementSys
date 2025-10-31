-- Fix RLS policies to allow users to become members and create bills
-- This addresses the foreign key constraint and RLS policy issues

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can insert members" ON public.members;
DROP POLICY IF EXISTS "Users can insert own member record" ON public.members;
DROP POLICY IF EXISTS "Only admins can insert bills" ON public.bills;
DROP POLICY IF EXISTS "Admins can insert bills" ON public.bills;
DROP POLICY IF EXISTS "Users can insert own bills" ON public.bills;

-- MEMBERS TABLE POLICIES - Allow users to create their own member records
-- Admins can insert any member
CREATE POLICY "Admins can insert members" ON public.members
    FOR INSERT WITH CHECK (is_admin());

-- Users can insert their own member record (for becoming a member)
CREATE POLICY "Users can insert own member record" ON public.members
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- BILLS TABLE POLICIES - Allow users to create bills for their own membership
-- Admins can insert any bill
CREATE POLICY "Admins can insert bills" ON public.bills
    FOR INSERT WITH CHECK (is_admin());

-- Users can insert bills for their own member record (when becoming a member)
-- This allows users to create bills when they upgrade to member status
CREATE POLICY "Users can insert own bills" ON public.bills
    FOR INSERT WITH CHECK (
        -- Allow if user is admin
        is_admin() OR
        -- Allow if the bill is for a member record owned by the current user
        EXISTS (
            SELECT 1 FROM public.members 
            WHERE id = member_id AND user_id = auth.uid()
        )
    );

-- Also allow users to view their own bills (in case this policy is missing)
DROP POLICY IF EXISTS "Members can view own bills" ON public.bills;
CREATE POLICY "Users can view own bills" ON public.bills
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.members 
            WHERE id = member_id AND user_id = auth.uid()
        ) OR is_admin()
    );

-- Allow users to update their own role when becoming a member
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Allow user registration (insert new users)
-- This is needed for the signup process to work
DROP POLICY IF EXISTS "Allow user registration" ON public.users;
CREATE POLICY "Allow user registration" ON public.users
    FOR INSERT WITH CHECK (true);