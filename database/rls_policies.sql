-- Row Level Security (RLS) Policies for Gym Management System
-- These policies implement role-based access control

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM public.users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'ADMIN';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is member
CREATE OR REPLACE FUNCTION is_member()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'MEMBER';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user's member record
CREATE OR REPLACE FUNCTION get_current_member_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id 
        FROM public.members 
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS TABLE POLICIES
-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Allow admins to view all users
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (is_admin());

-- Allow admins to update all users
CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE USING (is_admin());

-- Allow admins to insert new users
CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT WITH CHECK (is_admin());

-- Allow admins to delete users
CREATE POLICY "Admins can delete users" ON public.users
    FOR DELETE USING (is_admin());

-- FEE PACKAGES TABLE POLICIES
-- Allow everyone to read fee packages (for selection)
CREATE POLICY "Everyone can view fee packages" ON public.fee_packages
    FOR SELECT USING (true);

-- Only admins can modify fee packages
CREATE POLICY "Only admins can insert fee packages" ON public.fee_packages
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update fee packages" ON public.fee_packages
    FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete fee packages" ON public.fee_packages
    FOR DELETE USING (is_admin());

-- MEMBERS TABLE POLICIES
-- Members can view their own record
CREATE POLICY "Members can view own record" ON public.members
    FOR SELECT USING (user_id = auth.uid());

-- Members can update their own record (limited fields)
CREATE POLICY "Members can update own record" ON public.members
    FOR UPDATE USING (user_id = auth.uid());

-- Admins can view all members
CREATE POLICY "Admins can view all members" ON public.members
    FOR SELECT USING (is_admin());

-- Admins can insert new members
CREATE POLICY "Admins can insert members" ON public.members
    FOR INSERT WITH CHECK (is_admin());

-- Admins can update all members
CREATE POLICY "Admins can update all members" ON public.members
    FOR UPDATE USING (is_admin());

-- Admins can delete members
CREATE POLICY "Admins can delete members" ON public.members
    FOR DELETE USING (is_admin());

-- BILLS TABLE POLICIES
-- Members can view their own bills
CREATE POLICY "Members can view own bills" ON public.bills
    FOR SELECT USING (
        member_id = get_current_member_id()
    );

-- Admins can view all bills
CREATE POLICY "Admins can view all bills" ON public.bills
    FOR SELECT USING (is_admin());

-- Only admins can insert bills
CREATE POLICY "Only admins can insert bills" ON public.bills
    FOR INSERT WITH CHECK (is_admin());

-- Only admins can update bills
CREATE POLICY "Only admins can update bills" ON public.bills
    FOR UPDATE USING (is_admin());

-- Only admins can delete bills
CREATE POLICY "Only admins can delete bills" ON public.bills
    FOR DELETE USING (is_admin());

-- NOTIFICATIONS TABLE POLICIES
-- Members can view their own notifications
CREATE POLICY "Members can view own notifications" ON public.notifications
    FOR SELECT USING (
        member_id = get_current_member_id()
    );

-- Members can update their own notifications (mark as read)
CREATE POLICY "Members can update own notifications" ON public.notifications
    FOR UPDATE USING (
        member_id = get_current_member_id()
    );

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications" ON public.notifications
    FOR SELECT USING (is_admin());

-- Admins can insert notifications
CREATE POLICY "Admins can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (is_admin());

-- Admins can update all notifications
CREATE POLICY "Admins can update all notifications" ON public.notifications
    FOR UPDATE USING (is_admin());

-- Admins can delete notifications
CREATE POLICY "Admins can delete notifications" ON public.notifications
    FOR DELETE USING (is_admin());

-- STORAGE POLICIES (for profile photos and receipts)
-- These will be applied to Supabase Storage buckets

-- Profile photos bucket policies
-- Members can upload/update their own profile photo
-- Admins can upload/update any profile photo
-- Everyone can view profile photos (public read)

-- Receipts bucket policies  
-- Only admins can upload receipts
-- Members can view their own receipts
-- Admins can view all receipts