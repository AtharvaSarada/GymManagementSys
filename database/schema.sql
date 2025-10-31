-- Gym Management System Database Schema
-- This file contains the complete database schema for the gym management system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('ADMIN', 'MEMBER', 'USER');
CREATE TYPE member_status AS ENUM ('INACTIVE', 'ACTIVE', 'EXPIRED', 'SUSPENDED');
CREATE TYPE bill_status AS ENUM ('PENDING', 'PAID', 'OVERDUE');
CREATE TYPE notification_type AS ENUM ('BILL_PENDING', 'MEMBERSHIP_EXPIRING', 'MEMBERSHIP_ACTIVATED', 'GENERAL');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'USER',
    full_name TEXT,
    phone TEXT,
    profile_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fee packages table
CREATE TABLE public.fee_packages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    duration_months INTEGER NOT NULL,
    features TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Members table
CREATE TABLE public.members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    membership_number TEXT UNIQUE NOT NULL,
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    fee_package_id UUID REFERENCES public.fee_packages(id) ON DELETE SET NULL,
    membership_start_date DATE,
    membership_end_date DATE,
    status member_status NOT NULL DEFAULT 'INACTIVE',
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    date_of_birth DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bills table
CREATE TABLE public.bills (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
    fee_package_id UUID REFERENCES public.fee_packages(id) ON DELETE SET NULL NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    due_date DATE NOT NULL,
    paid_date DATE,
    status bill_status NOT NULL DEFAULT 'PENDING',
    receipt_url TEXT,
    generated_date DATE NOT NULL DEFAULT CURRENT_DATE,
    paid_by_admin BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    related_bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL,
    related_package_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_members_user_id ON public.members(user_id);
CREATE INDEX idx_members_membership_number ON public.members(membership_number);
CREATE INDEX idx_members_status ON public.members(status);
CREATE INDEX idx_bills_member_id ON public.bills(member_id);
CREATE INDEX idx_bills_status ON public.bills(status);
CREATE INDEX idx_bills_due_date ON public.bills(due_date);
CREATE INDEX idx_notifications_member_id ON public.notifications(member_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fee_packages_updated_at BEFORE UPDATE ON public.fee_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON public.bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate membership number
CREATE OR REPLACE FUNCTION generate_membership_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
BEGIN
    -- Get the current count of members and add 1
    SELECT COUNT(*) + 1 INTO counter FROM public.members;
    
    -- Format as GYM followed by 4-digit number
    new_number := 'GYM' || LPAD(counter::TEXT, 4, '0');
    
    -- Check if this number already exists (in case of concurrent inserts)
    WHILE EXISTS (SELECT 1 FROM public.members WHERE membership_number = new_number) LOOP
        counter := counter + 1;
        new_number := 'GYM' || LPAD(counter::TEXT, 4, '0');
    END LOOP;
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate membership number
CREATE OR REPLACE FUNCTION set_membership_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.membership_number IS NULL OR NEW.membership_number = '' THEN
        NEW.membership_number := generate_membership_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_membership_number_trigger
    BEFORE INSERT ON public.members
    FOR EACH ROW
    EXECUTE FUNCTION set_membership_number();