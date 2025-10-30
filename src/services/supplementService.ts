import { supabase } from './supabase';
import type { Supplement } from '../types/database';

export class SupplementService {
  // Get all available supplements
  static async getAvailableSupplements(): Promise<Supplement[]> {
    const { data, error } = await supabase
      .from('supplements')
      .select('*')
      .eq('is_available', true)
      .gt('stock_quantity', 0)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch supplements: ${error.message}`);
    }

    return data || [];
  }

  // Get supplement by ID
  static async getSupplementById(id: string): Promise<Supplement | null> {
    const { data, error } = await supabase
      .from('supplements')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Supplement not found
      }
      throw new Error(`Failed to fetch supplement: ${error.message}`);
    }

    return data;
  }

  // Purchase supplement (creates a bill)
  static async purchaseSupplement(
    userId: string, 
    supplementId: string, 
    quantity: number = 1
  ): Promise<{ success: boolean; billId?: string; message: string }> {
    try {
      // Get supplement details
      const supplement = await this.getSupplementById(supplementId);
      if (!supplement) {
        return { success: false, message: 'Supplement not found' };
      }

      if (!supplement.is_available || supplement.stock_quantity < quantity) {
        return { success: false, message: 'Supplement not available or insufficient stock' };
      }

      // Find the user's member record
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', userId)
        .single();

      let memberId: string;

      if (memberError || !memberData) {
        // If user doesn't have a member record, create one
        const { data: user } = await supabase
          .from('users')
          .select('email, full_name, phone, role')
          .eq('id', userId)
          .single();

        if (!user) {
          return { success: false, message: 'User not found' };
        }

        // Create member record for the user
        const membershipNumber = await this.generateMembershipNumber();
        const { data: newMember, error: createMemberError } = await supabase
          .from('members')
          .insert({
            user_id: userId,
            membership_number: membershipNumber,
            join_date: new Date().toISOString().split('T')[0],
            status: 'INACTIVE'
          })
          .select('id')
          .single();

        if (createMemberError || !newMember) {
          return { success: false, message: 'Failed to create member record' };
        }

        memberId = newMember.id;
      } else {
        memberId = memberData.id;
      }

      // Calculate total amount
      const totalAmount = supplement.price * quantity;

      // Create bill for supplement purchase
      const { data: bill, error: billError } = await supabase
        .from('bills')
        .insert({
          member_id: memberId,
          fee_package_id: null, // No fee package for supplement purchases
          amount: totalAmount,
          currency: 'INR',
          due_date: new Date().toISOString().split('T')[0], // Due immediately
          status: 'PENDING',
          generated_date: new Date().toISOString().split('T')[0],
          notes: `Supplement purchase: ${supplement.name} (Qty: ${quantity})`
        })
        .select('id')
        .single();

      if (billError) {
        return { success: false, message: 'Failed to create bill' };
      }

      // Create notification for the purchase
      await supabase
        .from('notifications')
        .insert({
          member_id: memberId,
          type: 'BILL_PENDING',
          title: 'Supplement Purchase Bill Generated',
          message: `Your bill for ${supplement.name} (₹${totalAmount}) has been generated. Please contact admin for payment.`,
          related_bill_id: bill.id,
          related_package_name: supplement.name
        });

      return { 
        success: true, 
        billId: bill.id,
        message: `Bill generated for ${supplement.name}. Total: ₹${totalAmount}` 
      };

    } catch (error) {
      console.error('SupplementService: Purchase failed:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Purchase failed' 
      };
    }
  }

  // Helper function to generate membership number (copied from MemberService)
  private static async generateMembershipNumber(): Promise<string> {
    const { count, error } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new Error(`Failed to generate membership number: ${error.message}`);
    }

    const memberCount = (count || 0) + 1;
    const paddedCount = memberCount.toString().padStart(4, '0');
    
    return `GYM${paddedCount}`;
  }

  // Get supplements by category
  static async getSupplementsByCategory(category: string): Promise<Supplement[]> {
    const { data, error } = await supabase
      .from('supplements')
      .select('*')
      .eq('category', category)
      .eq('is_available', true)
      .gt('stock_quantity', 0)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch supplements by category: ${error.message}`);
    }

    return data || [];
  }

  // Get all categories
  static async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('supplements')
      .select('category')
      .eq('is_available', true);

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    const categories = [...new Set(data?.map(s => s.category) || [])];
    return categories;
  }

  // Admin functions for supplement management
  
  // Get all supplements (including unavailable ones) - Admin only
  static async getAllSupplements(): Promise<Supplement[]> {
    const { data, error } = await supabase
      .from('supplements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch all supplements: ${error.message}`);
    }

    return data || [];
  }

  // Create new supplement - Admin only
  static async createSupplement(supplementData: {
    name: string;
    description?: string;
    price: number;
    category: string;
    stock_quantity: number;
    image_url?: string;
    is_available: boolean;
  }): Promise<Supplement> {
    const { data, error } = await supabase
      .from('supplements')
      .insert(supplementData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create supplement: ${error.message}`);
    }

    return data;
  }

  // Update supplement - Admin only
  static async updateSupplement(
    id: string, 
    supplementData: {
      name?: string;
      description?: string;
      price?: number;
      category?: string;
      stock_quantity?: number;
      image_url?: string;
      is_available?: boolean;
    }
  ): Promise<Supplement> {
    const { data, error } = await supabase
      .from('supplements')
      .update(supplementData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update supplement: ${error.message}`);
    }

    return data;
  }

  // Delete supplement - Admin only
  static async deleteSupplement(id: string): Promise<void> {
    const { error } = await supabase
      .from('supplements')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete supplement: ${error.message}`);
    }
  }
}