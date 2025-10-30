// Database types for Gym Management System
// These types match the Supabase database schema

export type UserRole = 'ADMIN' | 'MEMBER' | 'USER';
export type MemberStatus = 'INACTIVE' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
export type BillStatus = 'PENDING' | 'PAID' | 'OVERDUE';
export type NotificationType = 'BILL_PENDING' | 'MEMBERSHIP_EXPIRING' | 'MEMBERSHIP_ACTIVATED' | 'GENERAL';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  phone?: string;
  profile_photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface FeePackage {
  id: string;
  name: string;
  description?: string;
  amount: number;
  duration_months: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  user_id: string;
  membership_number: string;
  join_date: string;
  fee_package_id?: string;
  membership_start_date?: string;
  membership_end_date?: string;
  status: MemberStatus;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  date_of_birth?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  user?: User;
  fee_package?: FeePackage;
  bills?: Bill[];
}

export interface Bill {
  id: string;
  member_id: string;
  fee_package_id?: string; // Optional for supplement bills
  bill_type: 'MEMBERSHIP' | 'SUPPLEMENT';
  amount: number;
  currency: string;
  due_date: string;
  paid_date?: string;
  status: BillStatus;
  receipt_url?: string;
  generated_date: string;
  paid_by_admin: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  member?: Member;
  fee_package?: FeePackage;
}

export interface Notification {
  id: string;
  member_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  related_bill_id?: string;
  related_package_name?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  member?: Member;
  related_bill?: Bill;
}

export interface Supplement {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category: string;
  stock_quantity: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface DietMeal {
  name: string;
  time: string;
  foods: string[];
  calories: number;
}

export interface DietPlan {
  id: string;
  name: string;
  goal: 'fat_loss' | 'muscle_gain' | 'weight_gain';
  description?: string;
  daily_calories: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
  meals: DietMeal[];
  guidelines: string[];
  created_at: string;
  updated_at: string;
}

export interface MemberDietAssignment {
  id: string;
  member_id: string;
  diet_plan_id: string;
  assigned_by: string;
  assigned_date: string;
  start_date: string;
  end_date?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  diet_plan?: DietPlan;
  member?: Member;
  assigned_by_user?: User;
}

// Supabase Database type (for use with Supabase client)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: {
          id: string;
          email: string;
          role?: UserRole;
          full_name?: string;
          phone?: string;
          profile_photo_url?: string;
        };
        Update: {
          email?: string;
          role?: UserRole;
          full_name?: string;
          phone?: string;
          profile_photo_url?: string;
        };
      };
      fee_packages: {
        Row: FeePackage;
        Insert: {
          name: string;
          description?: string;
          amount: number;
          duration_months: number;
          features?: string[];
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string;
          amount?: number;
          duration_months?: number;
          features?: string[];
          is_active?: boolean;
        };
      };
      members: {
        Row: Member;
        Insert: {
          user_id: string;
          join_date?: string;
          fee_package_id?: string;
          membership_start_date?: string;
          membership_end_date?: string;
          status?: MemberStatus;
          address?: string;
          emergency_contact_name?: string;
          emergency_contact_phone?: string;
          date_of_birth?: string;
        };
        Update: {
          fee_package_id?: string;
          membership_start_date?: string;
          membership_end_date?: string;
          status?: MemberStatus;
          address?: string;
          emergency_contact_name?: string;
          emergency_contact_phone?: string;
          date_of_birth?: string;
        };
      };
      bills: {
        Row: Bill;
        Insert: {
          member_id: string;
          fee_package_id: string;
          amount: number;
          currency?: string;
          due_date: string;
          paid_date?: string;
          status?: BillStatus;
          receipt_url?: string;
          generated_date?: string;
          paid_by_admin?: boolean;
          notes?: string;
        };
        Update: {
          amount?: number;
          currency?: string;
          due_date?: string;
          paid_date?: string;
          status?: BillStatus;
          receipt_url?: string;
          paid_by_admin?: boolean;
          notes?: string;
        };
      };
      notifications: {
        Row: Notification;
        Insert: {
          member_id: string;
          type: NotificationType;
          title: string;
          message: string;
          is_read?: boolean;
          related_bill_id?: string;
          related_package_name?: string;
        };
        Update: {
          type?: NotificationType;
          title?: string;
          message?: string;
          is_read?: boolean;
          related_bill_id?: string;
          related_package_name?: string;
        };
      };
    };
  };
}

// Helper types for common operations
export type CreateMemberData = Omit<Member, 'id' | 'created_at' | 'updated_at' | 'membership_number'>;
export type UpdateMemberData = Partial<Omit<Member, 'id' | 'created_at' | 'updated_at' | 'membership_number'>>;

export type CreateBillData = Omit<Bill, 'id' | 'created_at' | 'updated_at'>;
export type UpdateBillData = Partial<Omit<Bill, 'id' | 'created_at' | 'updated_at'>>;

export type CreateNotificationData = Omit<Notification, 'id' | 'created_at' | 'updated_at'>;
export type UpdateNotificationData = Partial<Omit<Notification, 'id' | 'created_at' | 'updated_at'>>;

// Storage bucket types
export interface StorageBucket {
  PROFILE_PHOTOS: 'profile-photos';
  RECEIPTS: 'receipts';
}

export const STORAGE_BUCKETS: StorageBucket = {
  PROFILE_PHOTOS: 'profile-photos',
  RECEIPTS: 'receipts'
} as const;

// File upload constraints
export const FILE_CONSTRAINTS = {
  PROFILE_PHOTO: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp']
  },
  RECEIPT: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
    ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png']
  }
} as const;