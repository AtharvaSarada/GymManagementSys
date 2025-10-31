-- Supabase Storage Bucket Setup and Policies
-- This file contains SQL commands to create storage buckets and configure access policies

-- Create storage buckets (skip if buckets already exist)
INSERT INTO storage.buckets (id, name, public) VALUES 
('profile-photos', 'profile-photos', true),
('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- PROFILE PHOTOS BUCKET POLICIES
-- Allow public read access to profile photos
CREATE POLICY "Public read access for profile photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-photos');

-- Allow authenticated users to upload their own profile photos
CREATE POLICY "Users can upload own profile photo" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profile-photos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow users to update their own profile photos
CREATE POLICY "Users can update own profile photo" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'profile-photos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow users to delete their own profile photos
CREATE POLICY "Users can delete own profile photo" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'profile-photos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow admins to manage all profile photos
CREATE POLICY "Admins can manage all profile photos" ON storage.objects
    FOR ALL USING (
        bucket_id = 'profile-photos' 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- RECEIPTS BUCKET POLICIES
-- Only allow admins to upload receipts
CREATE POLICY "Only admins can upload receipts" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'receipts' 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Allow members to view their own receipts
CREATE POLICY "Members can view own receipts" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'receipts' 
        AND (
            -- Admin can view all
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'ADMIN'
            )
            OR
            -- Member can view their own receipts (filename contains their member ID)
            EXISTS (
                SELECT 1 FROM public.members m
                JOIN public.users u ON m.user_id = u.id
                WHERE u.id = auth.uid() 
                AND m.id::text = (storage.foldername(name))[1]
            )
        )
    );

-- Allow admins to update receipts
CREATE POLICY "Admins can update receipts" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'receipts' 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Allow admins to delete receipts
CREATE POLICY "Admins can delete receipts" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'receipts' 
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- File size and format restrictions will be handled in the application code
-- Recommended restrictions:
-- Profile photos: Max 5MB, formats: JPEG, PNG, WebP
-- Receipts: Max 10MB, formats: PDF, JPEG, PNG