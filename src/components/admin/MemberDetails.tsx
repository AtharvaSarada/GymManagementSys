import React, { useState } from 'react';
import type { Member } from '../../types/database';
import { FeePackageAssignment } from './FeePackageAssignment';
import { MemberStatusManagement } from './MemberStatusManagement';

interface MemberDetailsProps {
  member: Member;
  onEdit: () => void;
  onBack: () => void;
  onDelete: () => void;
  onMemberUpdated?: () => void;
}

type ViewMode = 'details' | 'assign-package' | 'manage-status';

export const MemberDetails: React.FC<MemberDetailsProps> = ({
  member,
  onEdit,
  onBack,
  onDelete,
  onMemberUpdated
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('details');
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: Member['status']) => {
    const statusConfig = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
      EXPIRED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Expired' },
      SUSPENDED: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Suspended' },
    };

    const config = statusConfig[status];
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const handlePackageAssigned = () => {
    setViewMode('details');
    onMemberUpdated?.();
  };

  const handleStatusChanged = () => {
    setViewMode('details');
    onMemberUpdated?.();
  };

  const handleBackToDetails = () => {
    setViewMode('details');
  };

  // Render different views based on mode
  if (viewMode === 'assign-package') {
    return (
      <FeePackageAssignment
        member={member}
        onAssigned={handlePackageAssigned}
        onCancel={handleBackToDetails}
      />
    );
  }

  if (viewMode === 'manage-status') {
    return (
      <MemberStatusManagement
        member={member}
        onStatusChanged={handleStatusChanged}
        onCancel={handleBackToDetails}
      />
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-lg font-medium text-gray-900">Member Details</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('assign-package')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Assign Package
            </button>
            <button
              onClick={() => setViewMode('manage-status')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Manage Status
            </button>
            <button
              onClick={onEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Edit Member
            </button>
            <button
              onClick={onDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Delete Member
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Profile Section */}
        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            {member.user?.profile_photo_url ? (
              <img
                className="h-24 w-24 rounded-full object-cover"
                src={member.user.profile_photo_url}
                alt={member.user.full_name || 'Profile'}
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center">
                <svg className="h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {member.user?.full_name || 'N/A'}
              </h2>
              {getStatusBadge(member.status)}
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Membership Number: <span className="font-medium text-gray-900">{member.membership_number}</span></p>
              <p>Member since: <span className="font-medium text-gray-900">{formatDate(member.join_date)}</span></p>
              {member.user?.role && (
                <p>Role: <span className="font-medium text-gray-900 capitalize">{member.user.role.toLowerCase()}</span></p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{member.user?.email || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900">{member.user?.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                <p className="text-gray-900">
                  {member.date_of_birth ? formatDate(member.date_of_birth) : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="text-gray-900">{member.address || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Name</label>
                <p className="text-gray-900">{member.emergency_contact_name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Phone</label>
                <p className="text-gray-900">{member.emergency_contact_phone || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Membership Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Membership Information</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Current Package</label>
                <p className="text-gray-900">
                  {member.fee_package ? (
                    <>
                      {member.fee_package.name}
                      <span className="text-sm text-gray-500 ml-2">
                        (₹{member.fee_package.amount} / {member.fee_package.duration_months} month{member.fee_package.duration_months !== 1 ? 's' : ''})
                      </span>
                    </>
                  ) : (
                    'No package assigned'
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Membership Start Date</label>
                <p className="text-gray-900">
                  {member.membership_start_date ? formatDate(member.membership_start_date) : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Membership End Date</label>
                <p className="text-gray-900">
                  {member.membership_end_date ? formatDate(member.membership_end_date) : 'N/A'}
                </p>
              </div>
            </div>

            {member.fee_package && (
              <div>
                <label className="text-sm font-medium text-gray-500">Package Features</label>
                <ul className="mt-2 space-y-1">
                  {member.fee_package.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No recent activity</p>
          </div>
        </div>
      </div>
    </div>
  );
};