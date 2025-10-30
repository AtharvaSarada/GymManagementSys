import { supabase } from './supabase';
import type { Bill, Member, BillStatus } from '../types/database';

export class BillingService {
  // Get all bills
  static async getAllBills(): Promise<Bill[]> {
    const { data, error } = await supabase
      .from('bills')
      .select(`
        *,
        member:members(
          *,
          user:users(*)
        ),
        fee_package:fee_packages(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch bills: ${error.message}`);
    }

    return data || [];
  }

  // Get bills by member ID
  static async getBillsByMemberId(memberId: string): Promise<Bill[]> {
    const { data, error } = await supabase
      .from('bills')
      .select(`
        *,
        member:members(
          *,
          user:users(*)
        ),
        fee_package:fee_packages(*)
      `)
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch member bills: ${error.message}`);
    }

    return data || [];
  }

  // Get bills by status
  static async getBillsByStatus(status: BillStatus): Promise<Bill[]> {
    const { data, error } = await supabase
      .from('bills')
      .select(`
        *,
        member:members(
          *,
          user:users(*)
        ),
        fee_package:fee_packages(*)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch bills by status: ${error.message}`);
    }

    return data || [];
  }

  // Create bill for member with fee package
  static async createBill(memberId: string, feePackageId: string): Promise<Bill> {
    // Get fee package details
    const { data: feePackage, error: packageError } = await supabase
      .from('fee_packages')
      .select('*')
      .eq('id', feePackageId)
      .single();

    if (packageError) {
      throw new Error(`Failed to fetch fee package: ${packageError.message}`);
    }

    // Calculate due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const billData = {
      member_id: memberId,
      fee_package_id: feePackageId,
      amount: feePackage.amount,
      currency: 'INR',
      due_date: dueDate.toISOString(),
      status: 'PENDING' as BillStatus,
      generated_date: new Date().toISOString(),
      paid_by_admin: false
    };

    const { data, error } = await supabase
      .from('bills')
      .insert(billData)
      .select(`
        *,
        member:members(
          *,
          user:users(*)
        ),
        fee_package:fee_packages(*)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create bill: ${error.message}`);
    }

    return data;
  }

  // Mark bill as paid and activate membership (for membership bills) or just mark as paid (for supplement bills)
  static async markBillAsPaid(billId: string): Promise<{
    bill: Bill;
    member: Member;
  }> {
    // Get bill details
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .select(`
        *,
        member:members(*),
        fee_package:fee_packages(*)
      `)
      .eq('id', billId)
      .single();

    if (billError) {
      throw new Error(`Failed to fetch bill: ${billError.message}`);
    }

    // Update bill status
    const { data: updatedBill, error: updateBillError } = await supabase
      .from('bills')
      .update({
        status: 'PAID',
        paid_date: new Date().toISOString(),
        paid_by_admin: true
      })
      .eq('id', billId)
      .select(`
        *,
        member:members(
          *,
          user:users(*)
        ),
        fee_package:fee_packages(*)
      `)
      .single();

    if (updateBillError) {
      throw new Error(`Failed to update bill: ${updateBillError.message}`);
    }

    let updatedMember = bill.member;

    // Only activate membership for MEMBERSHIP bills, not SUPPLEMENT bills
    if (bill.bill_type === 'MEMBERSHIP' && bill.fee_package) {
      // Calculate membership dates
      const membershipStartDate = new Date();
      const membershipEndDate = new Date();
      membershipEndDate.setMonth(membershipEndDate.getMonth() + bill.fee_package.duration_months);

      // Update member status and membership dates
      const { data: memberData, error: updateMemberError } = await supabase
        .from('members')
        .update({
          status: 'ACTIVE',
          membership_start_date: membershipStartDate.toISOString(),
          membership_end_date: membershipEndDate.toISOString(),
          fee_package_id: bill.fee_package_id
        })
        .eq('id', bill.member_id)
        .select(`
          *,
          user:users(*),
          fee_package:fee_packages(*)
        `)
        .single();

      if (updateMemberError) {
        throw new Error(`Failed to update member: ${updateMemberError.message}`);
      }

      updatedMember = memberData;

      // Create membership activation notification
      await this.createMembershipActivationNotification(
        bill.member_id,
        bill.fee_package.name
      );
    } else if (bill.bill_type === 'SUPPLEMENT') {
      // For supplement bills, just create a payment confirmation notification
      await this.createSupplementPaymentNotification(
        bill.member_id,
        bill.notes || 'Supplement purchase',
        bill.amount
      );
    }

    return {
      bill: updatedBill,
      member: updatedMember
    };
  }

  // Create membership activation notification
  private static async createMembershipActivationNotification(
    memberId: string,
    packageName: string
  ): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        member_id: memberId,
        type: 'MEMBERSHIP_ACTIVATED',
        title: 'Membership Activated',
        message: `Welcome! Your ${packageName} membership is now active`,
        is_read: false,
        related_package_name: packageName
      });

    if (error) {
      console.error('Failed to create activation notification:', error);
    }
  }

  // Create supplement payment confirmation notification
  private static async createSupplementPaymentNotification(
    memberId: string,
    supplementInfo: string,
    amount: number
  ): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        member_id: memberId,
        type: 'GENERAL',
        title: 'Payment Received',
        message: `Payment of ₹${amount} received for ${supplementInfo}. Thank you!`,
        is_read: false,
        related_package_name: supplementInfo
      });

    if (error) {
      console.error('Failed to create supplement payment notification:', error);
    }
  }

  // Create bill pending notification
  static async createBillPendingNotification(
    memberId: string,
    billId: string,
    packageName: string,
    amount: number
  ): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        member_id: memberId,
        type: 'BILL_PENDING',
        title: 'Payment Pending',
        message: `Payment pending for ${packageName} - ₹${amount}`,
        is_read: false,
        related_bill_id: billId,
        related_package_name: packageName
      });

    if (error) {
      console.error('Failed to create bill pending notification:', error);
    }
  }

  // Get billing statistics
  static async getBillingStats(): Promise<{
    totalRevenue: number;
    monthlyRevenue: number;
    pendingBills: number;
    paidBills: number;
    overdueBills: number;
  }> {
    const { data: bills, error } = await supabase
      .from('bills')
      .select('amount, status, paid_date, due_date');

    if (error) {
      throw new Error(`Failed to fetch billing stats: ${error.message}`);
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const stats = {
      totalRevenue: 0,
      monthlyRevenue: 0,
      pendingBills: 0,
      paidBills: 0,
      overdueBills: 0,
    };

    bills?.forEach(bill => {
      if (bill.status === 'PAID') {
        stats.totalRevenue += bill.amount;
        stats.paidBills++;

        // Check if paid this month
        if (bill.paid_date) {
          const paidDate = new Date(bill.paid_date);
          if (paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear) {
            stats.monthlyRevenue += bill.amount;
          }
        }
      } else if (bill.status === 'PENDING') {
        stats.pendingBills++;
        
        // Check if overdue
        const dueDate = new Date(bill.due_date);
        if (dueDate < now) {
          stats.overdueBills++;
        }
      }
    });

    return stats;
  }

  // Update overdue bills
  static async updateOverdueBills(): Promise<void> {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('bills')
      .update({ status: 'OVERDUE' })
      .eq('status', 'PENDING')
      .lt('due_date', now);

    if (error) {
      throw new Error(`Failed to update overdue bills: ${error.message}`);
    }
  }
}