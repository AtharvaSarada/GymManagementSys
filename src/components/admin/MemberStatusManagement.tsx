import React, { useState } from 'react';
import { MemberService } from '../../services/memberService';
import type { Member, MemberStatus } from '../../types/database';

interface MemberStatusManagementProps {
  member: Member;
  onStatusChanged: () => void;
  onCancel: () => void;
}

export const MemberStatusManagement: React.FC<MemberStatusManagementProps> = ({
  member,
  onStatusChanged,
  onCancel
}) => {
  const [selectedStatus, setSelectedStatus] = useState<MemberStatus>(member.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const statusOptions: { value: MemberStatus; label: string; description: string; color: string }[] = [
    {
      value: 'ACTIVE',
      label: 'Active',
      description: 'Member has an active membership and can access gym facilities',
      color: 'text-green-700'
    },
    {
      value: 'INACTIVE',
      label: 'Inactive',
      description: 'Member has no active membership or pending payment',
      color: 'text-gray-700'
    },
    {
      value: 'EXPIRED',
      label: 'Expired',
      description: 'Member\'s membership has expired and needs renewal',
      color: 'text-red-700'
    },
    {
      value: 'SUSPENDED',
      label: 'Suspended',
      description: 'Member is temporarily suspended from gym access',
      color: 'text-yellow-700'
    }
  ];

  const handleStatusChange = async () => {
    if (selectedStatus === member.status) {
      setError('Please select a different status');
      return;
    }

    if (selectedStatus === 'SUSPENDED' && !reason.trim()) {
      setError('Please provide a reason for suspension');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await MemberService.updateMember(member.id, {
        status: selectedStatus
      });

      // TODO: Create a status change notification if needed
      // This could be implemented later as part of the notification system

      onStatusChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: MemberStatus) => {
    const statusConfig = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
      EXPIRED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Expired' },
      SUSPENDED: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Suspended' },
    };

    const config = statusConfig[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Manage Member Status
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

      <div className="p-6 space-y-6">
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

        {/* Member Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {member.user?.profile_photo_url ? (
                <img
                  className="h-12 w-12 rounded-full object-cover"
                  src={member.user.profile_photo_url}
                  alt={member.user.full_name || 'Profile'}
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                  <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900">{member.user?.full_name}</h4>
              <p className="text-sm text-gray-500">Membership: {member.membership_number}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-500">Current Status:</span>
                {getStatusBadge(member.status)}
              </div>
            </div>
          </div>
        </div>

        {/* Status Selection */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Select New Status</h4>
          
          <div className="space-y-3">
            {statusOptions.map((option) => (
              <div
                key={option.value}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedStatus === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedStatus(option.value)}
              >
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="memberStatus"
                    value={option.value}
                    checked={selectedStatus === option.value}
                    onChange={() => setSelectedStatus(option.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-1"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center space-x-2">
                      <label className={`text-sm font-medium ${option.color}`}>
                        {option.label}
                      </label>
                      {option.value === member.status && (
                        <span className="text-xs text-gray-500">(Current)</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reason for Suspension */}
        {selectedStatus === 'SUSPENDED' && (
          <div className="space-y-2">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
              Reason for Suspension *
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Please provide a reason for suspending this member..."
            />
          </div>
        )}

        {/* Status Change Summary */}
        {selectedStatus !== member.status && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-900 mb-2">Status Change Summary</h4>
            <div className="text-sm text-yellow-800 space-y-1">
              <p>
                Changing status from {getStatusBadge(member.status)} to {getStatusBadge(selectedStatus)}
              </p>
              {selectedStatus === 'SUSPENDED' && reason && (
                <p>Reason: <span className="font-medium">{reason}</span></p>
              )}
              <p className="text-xs text-yellow-700 mt-2">
                {selectedStatus === 'ACTIVE' && 'Member will regain access to gym facilities'}
                {selectedStatus === 'INACTIVE' && 'Member will lose access to gym facilities'}
                {selectedStatus === 'EXPIRED' && 'Member status will be marked as expired'}
                {selectedStatus === 'SUSPENDED' && 'Member will be temporarily suspended from gym access'}
              </p>
            </div>
          </div>
        )}

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
            onClick={handleStatusChange}
            disabled={loading || selectedStatus === member.status || (selectedStatus === 'SUSPENDED' && !reason.trim())}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {loading ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
};