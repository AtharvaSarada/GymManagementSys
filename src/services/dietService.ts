import { supabase } from './supabase';
import type { DietPlan, MemberDietAssignment } from '../types/database';

export class DietService {
  // Get all diet plans
  static async getAllDietPlans(): Promise<DietPlan[]> {
    const { data, error } = await supabase
      .from('diet_plans')
      .select('*')
      .order('goal', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch diet plans: ${error.message}`);
    }

    return data || [];
  }

  // Get diet plan by ID
  static async getDietPlanById(id: string): Promise<DietPlan | null> {
    const { data, error } = await supabase
      .from('diet_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch diet plan: ${error.message}`);
    }

    return data;
  }

  // Assign diet plan to member
  static async assignDietToMember(
    memberId: string,
    dietPlanId: string,
    assignedBy: string,
    notes?: string,
    endDate?: string
  ): Promise<{ success: boolean; assignmentId?: string; message: string }> {
    try {
      // First, cancel any existing active diet assignment for this member
      await supabase
        .from('member_diet_assignments')
        .update({ status: 'CANCELLED' })
        .eq('member_id', memberId)
        .eq('status', 'ACTIVE');

      // Create new diet assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from('member_diet_assignments')
        .insert({
          member_id: memberId,
          diet_plan_id: dietPlanId,
          assigned_by: assignedBy,
          notes: notes,
          end_date: endDate,
          status: 'ACTIVE'
        })
        .select('id')
        .single();

      if (assignmentError) {
        return { success: false, message: 'Failed to assign diet plan' };
      }

      // Get diet plan name for notification
      const dietPlan = await this.getDietPlanById(dietPlanId);
      if (!dietPlan) {
        return { success: false, message: 'Diet plan not found' };
      }

      // Create notification for the member
      await supabase
        .from('notifications')
        .insert({
          member_id: memberId,
          type: 'DIET_ASSIGNED',
          title: 'New Diet Plan Assigned',
          message: `You have been assigned the "${dietPlan.name}" diet plan. Check your dashboard to view the details and start your nutrition journey!`,
          related_package_name: dietPlan.name
        });

      return {
        success: true,
        assignmentId: assignment.id,
        message: `Diet plan "${dietPlan.name}" assigned successfully`
      };

    } catch (error) {
      console.error('DietService: Assignment failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Assignment failed'
      };
    }
  }

  // Get member's current diet assignment
  static async getMemberCurrentDiet(memberId: string): Promise<MemberDietAssignment | null> {
    const { data, error } = await supabase
      .from('member_diet_assignments')
      .select(`
        *,
        diet_plan:diet_plans(*),
        assigned_by_user:users(full_name, email)
      `)
      .eq('member_id', memberId)
      .eq('status', 'ACTIVE')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No active diet assignment
      }
      throw new Error(`Failed to fetch member diet: ${error.message}`);
    }

    return data;
  }

  // Get all diet assignments for admin view
  static async getAllDietAssignments(): Promise<MemberDietAssignment[]> {
    const { data, error } = await supabase
      .from('member_diet_assignments')
      .select(`
        *,
        diet_plan:diet_plans(*),
        member:members(
          id,
          membership_number,
          user:users(full_name, email, phone)
        ),
        assigned_by_user:users(full_name, email)
      `)
      .order('assigned_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch diet assignments: ${error.message}`);
    }

    return data || [];
  }

  // Update diet assignment status
  static async updateDietAssignmentStatus(
    assignmentId: string,
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED',
    notes?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const updateData: any = { status };
      if (notes) {
        updateData.notes = notes;
      }

      const { error } = await supabase
        .from('member_diet_assignments')
        .update(updateData)
        .eq('id', assignmentId);

      if (error) {
        return { success: false, message: 'Failed to update diet assignment' };
      }

      return { success: true, message: 'Diet assignment updated successfully' };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Update failed'
      };
    }
  }

  // Get member's diet history
  static async getMemberDietHistory(memberId: string): Promise<MemberDietAssignment[]> {
    const { data, error } = await supabase
      .from('member_diet_assignments')
      .select(`
        *,
        diet_plan:diet_plans(*),
        assigned_by_user:users(full_name, email)
      `)
      .eq('member_id', memberId)
      .order('assigned_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch diet history: ${error.message}`);
    }

    return data || [];
  }

  // Get diet plans by goal
  static async getDietPlansByGoal(goal: 'fat_loss' | 'muscle_gain' | 'weight_gain'): Promise<DietPlan[]> {
    const { data, error } = await supabase
      .from('diet_plans')
      .select('*')
      .eq('goal', goal)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch diet plans by goal: ${error.message}`);
    }

    return data || [];
  }
}