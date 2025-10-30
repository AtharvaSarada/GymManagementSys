import React from 'react';
import type { Notification, NotificationType } from '../../types/database';

interface NotificationListProps {
  notifications: Notification[];
  filterType: NotificationType | 'ALL';
  onFilterChange: (type: NotificationType | 'ALL') => void;
  onDelete: (notificationId: string) => void;
  loading: boolean;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  filterType,
  onFilterChange,
  onDelete,
  loading
}) => {
  const getTypeBadge = (type: NotificationType) => {
    const typeConfig = {
      BILL_PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Bill Pending' },
      MEMBERSHIP_EXPIRING: { bg: 'bg-red-100', text: 'text-red-800', label: 'Expiring' },
      MEMBERSHIP_ACTIVATED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Activated' },
      GENERAL: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'General' },
    };

    const config = typeConfig[type];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'BILL_PENDING':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'MEMBERSHIP_EXPIRING':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'MEMBERSHIP_ACTIVATED':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'GENERAL':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h10V9H4v2z" />
          </svg>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by Type:</label>
            <select
              value={filterType}
              onChange={(e) => onFilterChange(e.target.value as NotificationType | 'ALL')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Notifications</option>
              <option value="GENERAL">General</option>
              <option value="BILL_PENDING">Bill Pending</option>
              <option value="MEMBERSHIP_EXPIRING">Membership Expiring</option>
              <option value="MEMBERSHIP_ACTIVATED">Membership Activated</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="px-6 py-12 text-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">Loading notifications...</p>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="flex flex-col items-center">
              <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h10V9H4v2z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">
                {filterType === 'ALL' ? 'No notifications found.' : `No ${filterType.toLowerCase().replace('_', ' ')} notifications found.`}
              </p>
            </div>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                !notification.is_read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getTypeIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </h4>
                      {getTypeBadge(notification.type)}
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>

                    <p className={`text-sm ${!notification.is_read ? 'text-gray-800' : 'text-gray-600'} mb-2`}>
                      {notification.message}
                    </p>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        <div className="flex-shrink-0">
                          {notification.member?.user?.profile_photo_url ? (
                            <img
                              className="h-6 w-6 rounded-full object-cover"
                              src={notification.member.user.profile_photo_url}
                              alt={notification.member.user.full_name || 'Profile'}
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                              <svg className="h-3 w-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <span className="font-medium">
                          {notification.member?.user?.full_name || 'Unknown Member'}
                        </span>
                        <span>•</span>
                        <span>{notification.member?.membership_number}</span>
                      </div>
                      
                      <span>•</span>
                      
                      <span title={formatDate(notification.created_at)}>
                        {formatRelativeTime(notification.created_at)}
                      </span>

                      {notification.related_package_name && (
                        <>
                          <span>•</span>
                          <span className="font-medium">{notification.related_package_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => onDelete(notification.id)}
                    className="text-red-400 hover:text-red-600 p-1 rounded"
                    title="Delete Notification"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};