import { supabase } from './supabase';
import type { Notification, NotificationType } from '../types/database';

export class NotificationService {
  // Get all notifications
  static async getAllNotifications(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        member:members(
          *,
          user:users(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }

    return data || [];
  }

  // Get notifications by member ID
  static async getNotificationsByMemberId(memberId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        member:members(
          *,
          user:users(*)
        )
      `)
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch member notifications: ${error.message}`);
    }

    return data || [];
  }

  // Get notifications by type
  static async getNotificationsByType(type: NotificationType): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        member:members(
          *,
          user:users(*)
        )
      `)
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch notifications by type: ${error.message}`);
    }

    return data || [];
  }

  // Create notification
  static async createNotification(notificationData: {
    member_id: string;
    type: NotificationType;
    title: string;
    message: string;
    related_bill_id?: string;
    related_package_name?: string;
  }): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notificationData,
        is_read: false
      })
      .select(`
        *,
        member:members(
          *,
          user:users(*)
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    return data;
  }

  // Create bulk notifications (for sending to multiple members)
  static async createBulkNotifications(notifications: {
    member_id: string;
    type: NotificationType;
    title: string;
    message: string;
    related_bill_id?: string;
    related_package_name?: string;
  }[]): Promise<Notification[]> {
    const notificationsWithDefaults = notifications.map(notification => ({
      ...notification,
      is_read: false
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationsWithDefaults)
      .select(`
        *,
        member:members(
          *,
          user:users(*)
        )
      `);

    if (error) {
      throw new Error(`Failed to create bulk notifications: ${error.message}`);
    }

    return data || [];
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select(`
        *,
        member:members(
          *,
          user:users(*)
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }

    return data;
  }

  // Mark all notifications as read for a member
  static async markAllAsReadForMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('member_id', memberId)
      .eq('is_read', false);

    if (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }

  // Delete all notifications for a member
  static async deleteAllForMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('member_id', memberId);

    if (error) {
      throw new Error(`Failed to delete member notifications: ${error.message}`);
    }
  }

  // Send monthly notification to all active members
  static async sendMonthlyNotificationToAllMembers(
    title: string,
    message: string
  ): Promise<Notification[]> {
    // Get all active members
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, user:users(*)')
      .eq('status', 'ACTIVE');

    if (membersError) {
      throw new Error(`Failed to fetch active members: ${membersError.message}`);
    }

    if (!members || members.length === 0) {
      return [];
    }

    // Create notifications for all active members
    const notifications = members.map(member => ({
      member_id: member.id,
      type: 'GENERAL' as NotificationType,
      title,
      message
    }));

    return this.createBulkNotifications(notifications);
  }

  // Send notification to specific members
  static async sendNotificationToMembers(
    memberIds: string[],
    title: string,
    message: string,
    type: NotificationType = 'GENERAL'
  ): Promise<Notification[]> {
    const notifications = memberIds.map(memberId => ({
      member_id: memberId,
      type,
      title,
      message
    }));

    return this.createBulkNotifications(notifications);
  }

  // Get notification statistics
  static async getNotificationStats(): Promise<{
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
    recentCount: number;
  }> {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('type, is_read, created_at');

    if (error) {
      throw new Error(`Failed to fetch notification stats: ${error.message}`);
    }

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const stats = {
      total: notifications?.length || 0,
      unread: 0,
      byType: {
        BILL_PENDING: 0,
        MEMBERSHIP_EXPIRING: 0,
        MEMBERSHIP_ACTIVATED: 0,
        GENERAL: 0
      } as Record<NotificationType, number>,
      recentCount: 0
    };

    notifications?.forEach(notification => {
      if (!notification.is_read) {
        stats.unread++;
      }

      if (notification.type in stats.byType) {
        stats.byType[notification.type as NotificationType]++;
      }

      const createdAt = new Date(notification.created_at);
      if (createdAt > last24Hours) {
        stats.recentCount++;
      }
    });

    return stats;
  }

  // Get unread count for a member
  static async getUnreadCountForMember(memberId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId)
      .eq('is_read', false);

    if (error) {
      throw new Error(`Failed to get unread count: ${error.message}`);
    }

    return count || 0;
  }

  // Create membership expiry warning notifications
  static async createExpiryWarningNotifications(): Promise<Notification[]> {
    // Get members whose membership expires in 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const { data: members, error: membersError } = await supabase
      .from('members')
      .select(`
        id,
        membership_end_date,
        user:users(*),
        fee_package:fee_packages(*)
      `)
      .eq('status', 'ACTIVE')
      .lte('membership_end_date', sevenDaysFromNow.toISOString())
      .gte('membership_end_date', new Date().toISOString());

    if (membersError) {
      throw new Error(`Failed to fetch expiring memberships: ${membersError.message}`);
    }

    if (!members || members.length === 0) {
      return [];
    }

    // Create expiry warning notifications
    const notifications = members.map(member => ({
      member_id: member.id,
      type: 'MEMBERSHIP_EXPIRING' as NotificationType,
      title: 'Membership Expiring Soon',
      message: `Your membership expires in 7 days. Renew now to continue enjoying gym facilities!`,
      related_package_name: (member.fee_package as any)?.name
    }));

    return this.createBulkNotifications(notifications);
  }

  // Subscribe to real-time notifications for a member
  static subscribeToMemberNotifications(
    memberId: string,
    callback: (notification: Notification) => void
  ) {
    return supabase
      .channel(`notifications:member_id=eq.${memberId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `member_id=eq.${memberId}`
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();
  }

  // Subscribe to all notifications (for admin)
  static subscribeToAllNotifications(
    callback: (notification: Notification) => void
  ) {
    return supabase
      .channel('notifications:all')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();
  }
}