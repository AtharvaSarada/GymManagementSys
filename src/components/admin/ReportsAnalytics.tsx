import React, { useState, useEffect } from 'react';
import { MemberService } from '../../services/memberService';
import { BillingService } from '../../services/billingService';
import { NotificationService } from '../../services/notificationService';
import type { Member } from '../../types/database';

interface AnalyticsData {
  memberStats: {
    total: number;
    active: number;
    inactive: number;
    expired: number;
    suspended: number;
  };
  billingStats: {
    totalRevenue: number;
    monthlyRevenue: number;
    pendingBills: number;
    paidBills: number;
    overdueBills: number;
  };
  notificationStats: {
    total: number;
    unread: number;
    recentCount: number;
  };
  recentMembers: Member[];
}

export const ReportsAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData>({
    memberStats: {
      total: 0,
      active: 0,
      inactive: 0,
      expired: 0,
      suspended: 0,
    },
    billingStats: {
      totalRevenue: 0,
      monthlyRevenue: 0,
      pendingBills: 0,
      paidBills: 0,
      overdueBills: 0,
    },
    notificationStats: {
      total: 0,
      unread: 0,
      recentCount: 0,
    },
    recentMembers: [],
  });

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all analytics data in parallel
      const [memberStats, billingStats, notificationStats, allMembers] = await Promise.all([
        MemberService.getMemberStats(),
        BillingService.getBillingStats(),
        NotificationService.getNotificationStats(),
        MemberService.getAllMembers()
      ]);

      // Get recent members (last 10)
      const recentMembers = allMembers
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      setData({
        memberStats,
        billingStats,
        notificationStats,
        recentMembers,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (type: 'members' | 'billing' | 'notifications') => {
    // Create CSV content based on type
    let csvContent = '';
    let filename = '';

    switch (type) {
      case 'members':
        csvContent = generateMemberReport();
        filename = `member-report-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'billing':
        csvContent = generateBillingReport();
        filename = `billing-report-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'notifications':
        csvContent = generateNotificationReport();
        filename = `notification-report-${new Date().toISOString().split('T')[0]}.csv`;
        break;
    }

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateMemberReport = (): string => {
    const headers = ['Name', 'Email', 'Membership Number', 'Status', 'Join Date', 'Package', 'Membership End Date'];
    const rows = data.recentMembers.map(member => [
      member.user?.full_name || 'N/A',
      member.user?.email || 'N/A',
      member.membership_number,
      member.status,
      new Date(member.join_date).toLocaleDateString('en-IN'),
      member.fee_package?.name || 'No package',
      member.membership_end_date ? new Date(member.membership_end_date).toLocaleDateString('en-IN') : 'N/A'
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  const generateBillingReport = (): string => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Revenue', `₹${data.billingStats.totalRevenue}`],
      ['Monthly Revenue', `₹${data.billingStats.monthlyRevenue}`],
      ['Paid Bills', data.billingStats.paidBills.toString()],
      ['Pending Bills', data.billingStats.pendingBills.toString()],
      ['Overdue Bills', data.billingStats.overdueBills.toString()]
    ];

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  const generateNotificationReport = (): string => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Notifications', data.notificationStats.total.toString()],
      ['Unread Notifications', data.notificationStats.unread.toString()],
      ['Recent Notifications (24h)', data.notificationStats.recentCount.toString()]
    ];

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600">View gym performance metrics and export reports</p>
        </div>
        <button
          onClick={loadAnalyticsData}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Data</span>
        </button>
      </div>

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
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{data.memberStats.total}</p>
              <p className="text-sm text-green-600">{data.memberStats.active} active</p>
            </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.billingStats.totalRevenue)}</p>
              <p className="text-sm text-blue-600">This month: {formatCurrency(data.billingStats.monthlyRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Bills</p>
              <p className="text-2xl font-bold text-gray-900">{data.billingStats.pendingBills}</p>
              <p className="text-sm text-red-600">{data.billingStats.overdueBills} overdue</p>
            </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h10V9H4v2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Notifications</p>
              <p className="text-2xl font-bold text-gray-900">{data.notificationStats.total}</p>
              <p className="text-sm text-orange-600">{data.notificationStats.unread} unread</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Status Distribution */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Member Status Distribution</h3>
            <button
              onClick={() => exportReport('members')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Export CSV
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-900">{data.memberStats.active}</span>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${data.memberStats.total > 0 ? (data.memberStats.active / data.memberStats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">Inactive</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-900">{data.memberStats.inactive}</span>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gray-500 h-2 rounded-full" 
                    style={{ width: `${data.memberStats.total > 0 ? (data.memberStats.inactive / data.memberStats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">Expired</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-900">{data.memberStats.expired}</span>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${data.memberStats.total > 0 ? (data.memberStats.expired / data.memberStats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">Suspended</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-900">{data.memberStats.suspended}</span>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${data.memberStats.total > 0 ? (data.memberStats.suspended / data.memberStats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Overview */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Revenue Overview</h3>
            <button
              onClick={() => exportReport('billing')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Export CSV
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">Total Revenue</span>
                <span className="text-lg font-bold text-green-900">{formatCurrency(data.billingStats.totalRevenue)}</span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">This Month</span>
                <span className="text-lg font-bold text-blue-900">{formatCurrency(data.billingStats.monthlyRevenue)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{data.billingStats.paidBills}</div>
                <div className="text-xs text-gray-500">Paid Bills</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">{data.billingStats.pendingBills}</div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{data.billingStats.overdueBills}</div>
                <div className="text-xs text-gray-500">Overdue</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Members */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Members</h3>
            <span className="text-sm text-gray-500">{data.recentMembers.length} members</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Join Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.recentMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">No members found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.recentMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {member.user?.profile_photo_url ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={member.user.profile_photo_url}
                              alt={member.user.full_name || 'Profile'}
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
                            {member.membership_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        member.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                        member.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.fee_package?.name || 'No package'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(member.join_date)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Placeholder for future features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supplement Store Placeholder */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Supplement Store</h3>
            <p className="text-sm text-gray-500 mb-4">
              Manage supplement inventory and sales tracking
            </p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Coming Soon
            </span>
          </div>
        </div>

        {/* Diet Management Placeholder */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Diet Management</h3>
            <p className="text-sm text-gray-500 mb-4">
              Create and manage nutrition plans with healthy food backgrounds
            </p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Coming Soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};