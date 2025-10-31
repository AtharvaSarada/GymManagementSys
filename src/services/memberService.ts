import { supabase } from './supabase';
import type { Member, UpdateMemberData } from '../types/database';

export class MemberService {
  // Get all members with their user details, fee packages, and latest bill status
  static async getAllMembers(): Promise<Member[]> {
    console.log('MemberService: Fetching all members from members table...');
    
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        user:users(*),
        fee_package:fee_packages(*),
        bills(
          id,
          status,
          amount,
          due_date,
          paid_date,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('MemberService: Error fetching members:', error);
      throw new Error(`Failed to fetch members: ${error.message}`);
    }

    // Filter out admin users from the member list
    const filteredMembers = data?.filter(member => {
      // Exclude members whose associated user has ADMIN role
      return member.user?.role !== 'ADMIN';
    }) || [];

    console.log('MemberService: Found members (excluding admins):', filteredMembers.length);
    
    return filteredMembers;
  }

  // Get member by ID
  static async getMemberById(id: string): Promise<Member | null> {
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        user:users(*),
        fee_package:fee_packages(*),
        bills(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Member not found
      }
      throw new Error(`Failed to fetch member: ${error.message}`);
    }

    return data;
  }

  // Create new member with proper user profile
  static async createMember(userData: {
    email: string;
    full_name: string;
    phone?: string;
    role?: 'MEMBER' | 'USER';
  }, memberData: {
    address?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    date_of_birth?: string;
  }): Promise<Member> {
    console.log('MemberService: Creating new member with user profile...');
    
    // Generate a UUID for the user
    const userId = crypto.randomUUID();
    
    // Create user profile first
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: userData.email,
        full_name: userData.full_name,
        phone: userData.phone,
        role: userData.role || 'MEMBER'
      })
      .select()
      .single();

    if (userError) {
      throw new Error(`Failed to create user profile: ${userError.message}`);
    }

    try {
      // Generate membership number
      const membershipNumber = await this.generateMembershipNumber();

      // Create the member record
      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert({
          user_id: user.id,
          membership_number: membershipNumber,
          join_date: new Date().toISOString().split('T')[0],
          status: 'INACTIVE',
          address: memberData.address,
          emergency_contact_name: memberData.emergency_contact_name,
          emergency_contact_phone: memberData.emergency_contact_phone,
          date_of_birth: memberData.date_of_birth,
        })
        .select(`
          *,
          user:users(*),
          fee_package:fee_packages(*)
        `)
        .single();

      if (memberError) {
        // Cleanup: delete the user if member creation fails
        await supabase.from('users').delete().eq('id', user.id);
        throw new Error(`Failed to create member: ${memberError.message}`);
      }

      console.log('MemberService: Member created successfully:', {
        membershipNumber: member.membership_number,
        userName: member.user?.full_name,
        userEmail: member.user?.email,
        userRole: member.user?.role,
        status: member.status
      });
      return member;
      
    } catch (error) {
      // Cleanup user if anything fails
      await supabase.from('users').delete().eq('id', user.id);
      throw error;
    }
  }

  // Update member
  static async updateMember(id: string, data: UpdateMemberData): Promise<Member> {
    const { data: member, error } = await supabase
      .from('members')
      .update(data)
      .eq('id', id)
      .select(`
        *,
        user:users(*),
        fee_package:fee_packages(*)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update member: ${error.message}`);
    }

    return member;
  }

  // Update member's user details
  static async updateMemberUser(memberId: string, userData: {
    full_name?: string;
    phone?: string;
    email?: string;
  }): Promise<Member> {
    // First get the member to find the user_id
    const member = await this.getMemberById(memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    // Update the user
    const { error: userError } = await supabase
      .from('users')
      .update(userData)
      .eq('id', member.user_id);

    if (userError) {
      throw new Error(`Failed to update user: ${userError.message}`);
    }

    // Return updated member
    return this.getMemberById(memberId) as Promise<Member>;
  }

  // Delete member (also deletes associated user)
  static async deleteMember(id: string): Promise<void> {
    // First get the member to find the user_id
    const member = await this.getMemberById(id);
    if (!member) {
      throw new Error('Member not found');
    }

    // Delete member first (due to foreign key constraints)
    const { error: memberError } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (memberError) {
      throw new Error(`Failed to delete member: ${memberError.message}`);
    }

    // Then delete the user
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', member.user_id);

    if (userError) {
      throw new Error(`Failed to delete user: ${userError.message}`);
    }
  }

  // Search members
  static async searchMembers(query: string): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        user:users(*),
        fee_package:fee_packages(*)
      `)
      .or(`membership_number.ilike.%${query}%,user.full_name.ilike.%${query}%,user.email.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to search members: ${error.message}`);
    }

    return data || [];
  }

  // Upload profile photo
  static async uploadProfilePhoto(memberId: string, file: File): Promise<string> {
    // Get the member to find the user_id
    const member = await this.getMemberById(memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    // Use user_id as folder name to match storage policies
    const filePath = `${member.user_id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Failed to upload photo: ${uploadError.message}`);
    }

    // Get public URL
    const { data } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    const photoUrl = data.publicUrl;

    // Update member's user profile photo URL
    await supabase
      .from('users')
      .update({ profile_photo_url: photoUrl })
      .eq('id', member.user_id);

    return photoUrl;
  }

  // Delete profile photo
  static async deleteProfilePhoto(memberId: string): Promise<void> {
    const member = await this.getMemberById(memberId);
    if (!member || !member.user?.profile_photo_url) {
      return;
    }

    // Extract file path from URL
    const url = new URL(member.user.profile_photo_url);
    const filePath = url.pathname.split('/').slice(-2).join('/'); // Get last two parts

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('profile-photos')
      .remove([filePath]);

    if (deleteError) {
      throw new Error(`Failed to delete photo: ${deleteError.message}`);
    }

    // Update user record
    await supabase
      .from('users')
      .update({ profile_photo_url: null })
      .eq('id', member.user_id);
  }

  // Generate unique membership number
  private static async generateMembershipNumber(): Promise<string> {
    const prefix = 'GYM';
    const year = new Date().getFullYear();
    
    // Get the count of members created this year
    const { count, error } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${year}-01-01`)
      .lt('created_at', `${year + 1}-01-01`);

    if (error) {
      throw new Error(`Failed to generate membership number: ${error.message}`);
    }

    const memberCount = (count || 0) + 1;
    const paddedCount = memberCount.toString().padStart(4, '0');
    
    return `${prefix}${year}${paddedCount}`;
  }

  // Get members by status
  static async getMembersByStatus(status: Member['status']): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        user:users(*),
        fee_package:fee_packages(*)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch members by status: ${error.message}`);
    }

    return data || [];
  }

  // Get member statistics from members table with proper status counts (excluding admins)
  static async getMemberStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    expired: number;
    suspended: number;
  }> {
    console.log('MemberService: Fetching member stats from members table...');
    
    const { data, error } = await supabase
      .from('members')
      .select(`
        status,
        user:users(role)
      `);

    if (error) {
      console.error('MemberService: Error fetching member stats:', error);
      throw new Error(`Failed to fetch member stats: ${error.message}`);
    }

    // Filter out admin users from stats
    const memberData = data?.filter(m => (m.user as any)?.role !== 'ADMIN') || [];

    const stats = {
      total: memberData.length,
      active: memberData.filter(m => m.status === 'ACTIVE').length,
      inactive: memberData.filter(m => m.status === 'INACTIVE').length,
      expired: memberData.filter(m => m.status === 'EXPIRED').length,
      suspended: memberData.filter(m => m.status === 'SUSPENDED').length,
    };

    console.log('MemberService: Member stats (excluding admins):', stats);
    return stats;
  }

  // Update expired memberships automatically
  static async updateExpiredMemberships(): Promise<{
    updated: number;
    expiredMembers: string[];
  }> {
    console.log('MemberService: Checking for expired memberships...');
    
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    
    // Find members whose membership has expired but status is still ACTIVE
    const { data: expiredMembers, error: fetchError } = await supabase
      .from('members')
      .select('id, membership_number, membership_end_date, user:users(full_name, email)')
      .eq('status', 'ACTIVE')
      .lt('membership_end_date', today)
      .not('membership_end_date', 'is', null);

    if (fetchError) {
      console.error('MemberService: Error fetching expired members:', fetchError);
      throw new Error(`Failed to fetch expired members: ${fetchError.message}`);
    }

    if (!expiredMembers || expiredMembers.length === 0) {
      console.log('MemberService: No expired memberships found');
      return { updated: 0, expiredMembers: [] };
    }

    console.log(`MemberService: Found ${expiredMembers.length} expired memberships`);

    // Update status to EXPIRED for all expired members
    const memberIds = expiredMembers.map(m => m.id);
    const { error: updateError } = await supabase
      .from('members')
      .update({ status: 'EXPIRED' })
      .in('id', memberIds);

    if (updateError) {
      console.error('MemberService: Error updating expired members:', updateError);
      throw new Error(`Failed to update expired members: ${updateError.message}`);
    }

    const expiredMemberNames = expiredMembers.map(m => 
      `${m.membership_number} (${(m.user as any)?.full_name || 'Unknown'})`
    );

    console.log('MemberService: Updated expired memberships:', expiredMemberNames);

    return {
      updated: expiredMembers.length,
      expiredMembers: expiredMemberNames
    };
  }

  // Check for memberships expiring soon (within 7 days)
  static async getMembersExpiringSoon(): Promise<Member[]> {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const todayStr = today.toISOString().split('T')[0];
    const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        user:users(*),
        fee_package:fee_packages(*)
      `)
      .eq('status', 'ACTIVE')
      .gte('membership_end_date', todayStr)
      .lte('membership_end_date', sevenDaysStr)
      .not('membership_end_date', 'is', null)
      .order('membership_end_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch members expiring soon: ${error.message}`);
    }

    return data || [];
  }

  // Sync missing member records - Create member records for users with MEMBER role who don't have them
  static async syncMissingMemberRecords(): Promise<{
    created: number;
    errors: string[];
    createdMembers: string[];
  }> {
    console.log('MemberService: Starting sync of missing member records...');
    
    try {
      // Get all users with MEMBER role
      const { data: memberUsers, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'MEMBER');

      if (usersError) {
        throw new Error(`Failed to fetch member users: ${usersError.message}`);
      }

      if (!memberUsers || memberUsers.length === 0) {
        console.log('MemberService: No users with MEMBER role found');
        return { created: 0, errors: [], createdMembers: [] };
      }

      console.log(`MemberService: Found ${memberUsers.length} users with MEMBER role`);

      // Get existing member records
      const { data: existingMembers, error: membersError } = await supabase
        .from('members')
        .select('user_id');

      if (membersError) {
        throw new Error(`Failed to fetch existing members: ${membersError.message}`);
      }

      const existingUserIds = new Set(existingMembers?.map(m => m.user_id) || []);
      
      // Find users who don't have member records
      const missingMemberUsers = memberUsers.filter(user => !existingUserIds.has(user.id));
      
      console.log(`MemberService: Found ${missingMemberUsers.length} users missing member records`);

      if (missingMemberUsers.length === 0) {
        return { created: 0, errors: [], createdMembers: [] };
      }

      const results = {
        created: 0,
        errors: [] as string[],
        createdMembers: [] as string[]
      };

      // Create member records for missing users
      for (const user of missingMemberUsers) {
        try {
          console.log(`MemberService: Creating member record for user: ${user.full_name} (${user.email})`);
          
          // Generate membership number
          const membershipNumber = await this.generateMembershipNumber();

          const memberData = {
            user_id: user.id,
            membership_number: membershipNumber,
            join_date: new Date().toISOString().split('T')[0],
            status: 'INACTIVE' as const
          };

          const { error: createError } = await supabase
            .from('members')
            .insert(memberData);

          if (createError) {
            const errorMsg = `Failed to create member for ${user.full_name} (${user.email}): ${createError.message}`;
            console.error('MemberService:', errorMsg);
            results.errors.push(errorMsg);
          } else {
            results.created++;
            results.createdMembers.push(`${user.full_name} (${user.email}) - ${membershipNumber}`);
            console.log(`MemberService: Successfully created member record for ${user.full_name} with membership number ${membershipNumber}`);
          }
        } catch (error) {
          const errorMsg = `Unexpected error creating member for ${user.full_name} (${user.email}): ${error}`;
          console.error('MemberService:', errorMsg);
          results.errors.push(errorMsg);
        }
      }

      console.log(`MemberService: Sync completed. Created: ${results.created}, Errors: ${results.errors.length}`);
      return results;
      
    } catch (error) {
      console.error('MemberService: Error during sync:', error);
      throw new Error(`Failed to sync member records: ${error}`);
    }
  }

  // Get all users with MEMBER role (including those without member records)
  static async getAllMemberUsers(): Promise<any[]> {
    console.log('MemberService: Fetching all users with MEMBER role...');
    
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        member:members(
          id,
          membership_number,
          join_date,
          status,
          membership_start_date,
          membership_end_date,
          fee_package_id,
          fee_package:fee_packages(*)
        )
      `)
      .eq('role', 'MEMBER')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('MemberService: Error fetching member users:', error);
      throw new Error(`Failed to fetch member users: ${error.message}`);
    }

    console.log(`MemberService: Found ${data?.length || 0} users with MEMBER role`);
    
    return data || [];
  }

  // Upgrade user to member (without package assignment - admin will assign later)
  static async upgradeUserToMember(
    userId: string,
    memberDetails: {
      phone?: string;
      address?: string;
      emergency_contact_name?: string;
      emergency_contact_phone?: string;
      date_of_birth?: string;
    }
  ): Promise<{ member: Member; membershipNumber: string }> {
    console.log('MemberService: Upgrading user to member:', userId);

    try {
      // Step 1: Update user role to MEMBER
      const { error: roleUpdateError } = await supabase
        .from('users')
        .update({ 
          role: 'MEMBER',
          phone: memberDetails.phone 
        })
        .eq('id', userId);

      if (roleUpdateError) {
        throw new Error(`Failed to update user role: ${roleUpdateError.message}`);
      }

      // Step 2: Generate membership number
      const membershipNumber = await this.generateMembershipNumber();

      // Step 3: Prepare member creation date
      const startDate = new Date();

      // Step 5: Create member record (INACTIVE until admin assigns package and marks bill as paid)
      const memberData = {
        user_id: userId,
        membership_number: membershipNumber,
        join_date: startDate.toISOString().split('T')[0],
        status: 'INACTIVE' as const, // Member starts as INACTIVE
        fee_package_id: null, // No package assigned initially
        membership_start_date: null, // Will be set when admin activates membership
        membership_end_date: null, // Will be calculated when admin activates membership
        address: memberDetails.address || null,
        emergency_contact_name: memberDetails.emergency_contact_name || null,
        emergency_contact_phone: memberDetails.emergency_contact_phone || null,
        date_of_birth: memberDetails.date_of_birth || null
      };

      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert(memberData)
        .select(`
          *,
          user:users(*),
          fee_package:fee_packages(*)
        `)
        .single();

      if (memberError) {
        // Rollback user role update
        await supabase
          .from('users')
          .update({ role: 'USER' })
          .eq('id', userId);
        
        throw new Error(`Failed to create member record: ${memberError.message}`);
      }

      console.log('MemberService: User successfully upgraded to member:', membershipNumber);
      return { member, membershipNumber };

    } catch (error) {
      console.error('MemberService: Error upgrading user to member:', error);
      throw error;
    }
  }
}