import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { BillsAndReceipts } from '../components/member/BillsAndReceipts';
import { MemberNotifications } from '../components/member/MemberNotifications';
import { MemberProfile } from '../components/member/MemberProfile';
import { MemberDietPlan } from '../components/member/MemberDietPlan';
import { SupplementStore } from '../components/shared/SupplementStore';
import type { Member } from '../types/database';

export const MemberDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'overview' | 'bills' | 'notifications' | 'diet' | 'supplements' | 'profile'>('overview');

  useEffect(() => {
    const fetchMemberData = async () => {
      if (!user) return;
      
      try {
        // Get member data by user ID
        const { data: members, error } = await supabase
          .from('members')
          .select(`
            *,
            user:users(*),
            fee_package:fee_packages(*)
          `)
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching member data:', error);
        } else {
          setMember(members);
        }
      } catch (error) {
        console.error('Error fetching member data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-indigo-900">
      {/* Workout regime background overlay */}
      <div className="absolute inset-0 bg-black/40"></div>
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M30 30c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm20 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z'/%3E%3Cpath d='M15 15h30v30H15z' opacity='0.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-sm shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                {/* Profile Photo */}
                <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden">
                  {member?.user?.profile_photo_url ? (
                    <img 
                      src={member.user.profile_photo_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {member?.user?.full_name?.charAt(0) || 'M'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Member Dashboard</h1>
                  <p className="text-gray-600">
                    Welcome back, {member?.user?.full_name || 'Member'}
                    {member?.membership_number && (
                      <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {member.membership_number}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: '🏠' },
                { id: 'bills', label: 'Bills & Receipts', icon: '📄' },
                { id: 'notifications', label: 'Notifications', icon: '🔔' },
                { id: 'diet', label: 'My Diet Plan', icon: '🍎' },
                { id: 'supplements', label: 'Supplement Store', icon: '💊' },
                { id: 'profile', label: 'Profile', icon: '👤' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as any)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeSection === item.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeSection === 'overview' && (
            <div className="space-y-8">
              {/* Membership Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Status Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      member?.status === 'ACTIVE' ? 'bg-green-500' :
                      member?.status === 'INACTIVE' ? 'bg-yellow-500' :
                      member?.status === 'EXPIRED' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Status</h3>
                      <p className={`text-sm font-semibold ${
                        member?.status === 'ACTIVE' ? 'text-green-600' :
                        member?.status === 'INACTIVE' ? 'text-yellow-600' :
                        member?.status === 'EXPIRED' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {member?.status || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Package Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Package</h3>
                      <p className="text-sm text-blue-600 font-semibold">
                        {member?.fee_package?.name || 'No Package'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Join Date Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Member Since</h3>
                      <p className="text-sm text-purple-600 font-semibold">
                        {member?.join_date ? new Date(member.join_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expiry Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Expires</h3>
                      <p className="text-sm text-orange-600 font-semibold">
                        {member?.membership_end_date ? new Date(member.membership_end_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Membership Details */}
              {member?.fee_package && (
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Current Membership Package</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{member.fee_package.name}</h3>
                      <p className="text-gray-600 mb-4">{member.fee_package.description}</p>
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl font-bold text-green-600">₹{member.fee_package.amount}</span>
                        <span className="text-gray-500">/ {member.fee_package.duration_months} month(s)</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-2">Package Features</h4>
                      <ul className="space-y-1">
                        {member.fee_package.features?.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {feature}
                          </li>
                        )) || []}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveSection('bills')}
                    className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">View Bills</div>
                      <div className="text-sm text-gray-500">Check payment history</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveSection('notifications')}
                    className="flex items-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h10V9H4v2z" />
                    </svg>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Notifications</div>
                      <div className="text-sm text-gray-500">View gym updates</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveSection('profile')}
                    className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Update Profile</div>
                      <div className="text-sm text-gray-500">Manage your information</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bills & Receipts Section */}
          {activeSection === 'bills' && (
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Bills & Receipts</h2>
              {member ? (
                <BillsAndReceipts memberId={member.id} />
              ) : (
                <p className="text-gray-600">Loading member information...</p>
              )}
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Notifications</h2>
              {member ? (
                <MemberNotifications memberId={member.id} />
              ) : (
                <p className="text-gray-600">Loading member information...</p>
              )}
            </div>
          )}

          {/* Diet Plan Section */}
          {activeSection === 'diet' && (
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">My Diet Plan</h2>
              {member ? (
                <MemberDietPlan memberId={member.id} />
              ) : (
                <p className="text-gray-600">Loading member information...</p>
              )}
            </div>
          )}

          {/* Supplement Store Section */}
          {activeSection === 'supplements' && (
            <div className="mt-[-2rem]">
              <SupplementStore />
            </div>
          )}

          {/* Profile Management Section */}
          {activeSection === 'profile' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
                Profile Management
              </h2>
              {member ? (
                <MemberProfile 
                  member={member} 
                  onMemberUpdate={(updatedMember) => setMember(updatedMember)}
                />
              ) : (
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
                  <p className="text-gray-600">Loading member information...</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};