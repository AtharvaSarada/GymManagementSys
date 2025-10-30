import React, { useState, useEffect } from 'react';
import { NotificationService } from '../../services/notificationService';
import { MemberService } from '../../services/memberService';
import type { Member, NotificationType } from '../../types/database';

interface SendNotificationFormProps {
  onNotificationSent: () => void;
  onCancel: () => void;
}

type RecipientType = 'all_active' | 'specific_members' | 'by_status';

export const SendNotificationForm: React.FC<SendNotificationFormProps> = ({
  onNotificationSent,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'GENERAL' as NotificationType,
    recipientType: 'all_active' as RecipientType,
    selectedMemberIds: [] as string[],
    memberStatus: 'ACTIVE' as Member['status']
  });

  useEffect(() => {
    if (formData.recipientType === 'specific_members') {
      loadMembers();
    }
  }, [formData.recipientType]);

  const loadMembers = async () => {
    try {
      setLoadingMembers(true);
      const data = await MemberService.getAllMembers();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMemberSelection = (memberId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedMemberIds: checked
        ? [...prev.selectedMemberIds, memberId]
        : prev.selectedMemberIds.filter(id => id !== memberId)
    }));
  };

  const handleSelectAllMembers = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedMemberIds: checked ? members.map(m => m.id) : []
    }));
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      setError('Please provide both title and message');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let notifications = [];

      if (formData.recipientType === 'all_active') {
        // Send to all active members
        notifications = await NotificationService.sendMonthlyNotificationToAllMembers(
          formData.title,
          formData.message
        );
      } else if (formData.recipientType === 'specific_members') {
        // Send to specific members
        if (formData.selectedMemberIds.length === 0) {
          setError('Please select at least one member');
          return;
        }
        notifications = await NotificationService.sendNotificationToMembers(
          formData.selectedMemberIds,
          formData.title,
          formData.message,
          formData.type
        );
      } else if (formData.recipientType === 'by_status') {
        // Send to members by status
        const membersByStatus = await MemberService.getMembersByStatus(formData.memberStatus);
        const memberIds = membersByStatus.map(m => m.id);
        
        if (memberIds.length === 0) {
          setError(`No members found with status: ${formData.memberStatus}`);
          return;
        }

        notifications = await NotificationService.sendNotificationToMembers(
          memberIds,
          formData.title,
          formData.message,
          formData.type
        );
      }

      alert(`Successfully sent ${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`);
      onNotificationSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const getRecipientCount = () => {
    if (formData.recipientType === 'specific_members') {
      return formData.selectedMemberIds.length;
    }
    // For other types, we'd need to fetch the count, but for simplicity we'll show "Multiple"
    return 'Multiple';
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Send Notification
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <form onSubmit={handleSendNotification} className="p-6 space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Notification Type */}
        <div className="space-y-2">
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Notification Type
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="GENERAL">General Message</option>
            <option value="BILL_PENDING">Bill Pending</option>
            <option value="MEMBERSHIP_EXPIRING">Membership Expiring</option>
            <option value="MEMBERSHIP_ACTIVATED">Membership Activated</option>
          </select>
        </div>

        {/* Recipients */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Recipients</label>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                id="all_active"
                name="recipientType"
                type="radio"
                value="all_active"
                checked={formData.recipientType === 'all_active'}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor="all_active" className="ml-3 text-sm text-gray-700">
                All Active Members
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="by_status"
                name="recipientType"
                type="radio"
                value="by_status"
                checked={formData.recipientType === 'by_status'}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor="by_status" className="ml-3 text-sm text-gray-700">
                Members by Status
              </label>
            </div>

            {formData.recipientType === 'by_status' && (
              <div className="ml-7">
                <select
                  name="memberStatus"
                  value={formData.memberStatus}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ACTIVE">Active Members</option>
                  <option value="INACTIVE">Inactive Members</option>
                  <option value="EXPIRED">Expired Members</option>
                  <option value="SUSPENDED">Suspended Members</option>
                </select>
              </div>
            )}

            <div className="flex items-center">
              <input
                id="specific_members"
                name="recipientType"
                type="radio"
                value="specific_members"
                checked={formData.recipientType === 'specific_members'}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor="specific_members" className="ml-3 text-sm text-gray-700">
                Specific Members
              </label>
            </div>
          </div>
        </div>

        {/* Member Selection */}
        {formData.recipientType === 'specific_members' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Select Members ({formData.selectedMemberIds.length} selected)
              </label>
              {!loadingMembers && members.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleSelectAllMembers(formData.selectedMemberIds.length !== members.length)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {formData.selectedMemberIds.length === members.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
              {loadingMembers ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading members...</p>
                </div>
              ) : members.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No members found
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {members.map((member) => (
                    <div key={member.id} className="p-3 hover:bg-gray-50">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`member-${member.id}`}
                          checked={formData.selectedMemberIds.includes(member.id)}
                          onChange={(e) => handleMemberSelection(member.id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`member-${member.id}`} className="ml-3 flex items-center space-x-3 flex-1 cursor-pointer">
                          <div className="flex-shrink-0">
                            {member.user?.profile_photo_url ? (
                              <img
                                className="h-8 w-8 rounded-full object-cover"
                                src={member.user.profile_photo_url}
                                alt={member.user.full_name || 'Profile'}
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {member.user?.full_name || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {member.membership_number} • {member.status}
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter notification title..."
          />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            required
            rows={4}
            className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter notification message..."
          />
        </div>

        {/* Preview */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h10V9H4v2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-medium text-gray-900">
                  {formData.title || 'Notification Title'}
                </h5>
                <p className="text-sm text-gray-600 mt-1">
                  {formData.message || 'Notification message will appear here...'}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Recipients: {getRecipientCount()} member{getRecipientCount() !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.title.trim() || !formData.message.trim()}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {loading ? 'Sending...' : 'Send Notification'}
          </button>
        </div>
      </form>
    </div>
  );
};