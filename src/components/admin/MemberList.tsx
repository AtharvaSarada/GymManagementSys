import React from 'react';

import type { Member } from '../../types/database';

interface MemberListProps {
  members: Member[];
  searchQuery: string;
  onSearch: (query: string) => void;
  onEdit: (member: Member) => void;
  onView: (member: Member) => void;
  onDelete: (member: Member) => void;
  onAssignPackage?: (member: Member) => void;
  loading: boolean;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  searchQuery,
  onSearch,
  onEdit,
  onView,
  onDelete,
  onAssignPackage,
  loading
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
      EXPIRED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Expired' },
      SUSPENDED: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Suspended' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INACTIVE;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getExpiryInfo = (member: Member) => {
    if (!member.membership_end_date) {
      return {
        text: 'No expiry set',
        className: 'text-gray-500',
        bgClassName: 'bg-gray-100',
        isExpired: false,
        daysUntilExpiry: null
      };
    }

    const endDate = new Date(member.membership_end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: `Expired ${Math.abs(diffDays)} days ago`,
        className: 'text-red-800',
        bgClassName: 'bg-red-100',
        isExpired: true,
        daysUntilExpiry: diffDays
      };
    } else if (diffDays === 0) {
      return {
        text: 'Expires today',
        className: 'text-orange-800',
        bgClassName: 'bg-orange-100',
        isExpired: false,
        daysUntilExpiry: diffDays
      };
    } else if (diffDays <= 7) {
      return {
        text: `Expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}`,
        className: 'text-yellow-800',
        bgClassName: 'bg-yellow-100',
        isExpired: false,
        daysUntilExpiry: diffDays
      };
    } else if (diffDays <= 30) {
      return {
        text: `Expires in ${diffDays} days`,
        className: 'text-blue-800',
        bgClassName: 'bg-blue-100',
        isExpired: false,
        daysUntilExpiry: diffDays
      };
    } else {
      return {
        text: formatDate(member.membership_end_date),
        className: 'text-green-800',
        bgClassName: 'bg-green-100',
        isExpired: false,
        daysUntilExpiry: diffDays
      };
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
      {/* Search and Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search members by name, email, or membership number..."
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Membership
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Package
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Package Expiry
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Join Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading members...</p>
                  </div>
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">
                      {searchQuery ? 'No members found matching your search.' : 'No members found. Add your first member to get started.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {member.user?.profile_photo_url ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={member.user.profile_photo_url}
                            alt={member.user?.full_name || 'Profile'}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {member.user?.full_name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.user?.email || 'N/A'}
                        </div>
                        {member.user?.phone && (
                          <div className="text-sm text-gray-500">
                            {member.user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {member.membership_number}
                    </div>
                    <div className="text-sm text-gray-500">
                      Member since {formatDate(member.join_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(member.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {member.fee_package?.name || 'No package assigned'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {member.fee_package ? (
                        <span>₹{member.fee_package.amount}/{member.fee_package.duration_months} month{member.fee_package.duration_months !== 1 ? 's' : ''}</span>
                      ) : onAssignPackage ? (
                        <button 
                          onClick={() => onAssignPackage(member)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Assign Package
                        </button>
                      ) : (
                        <span className="text-gray-400">No package</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const expiryInfo = getExpiryInfo(member);
                      return (
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${expiryInfo.bgClassName} ${expiryInfo.className}`}>
                            {expiryInfo.text}
                          </span>
                          {member.membership_start_date && (
                            <div className="text-xs text-gray-500 mt-1">
                              Started: {formatDate(member.membership_start_date)}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(member.join_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onView(member)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="View Details"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {onAssignPackage && (
                        <button
                          onClick={() => onAssignPackage(member)}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="Assign Package"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(member)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                        title="Edit Member"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(member)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Delete Member"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};