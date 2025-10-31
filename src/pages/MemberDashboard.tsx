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
  const { user, userProfile, signOut } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'overview' | 'bills' | 'notifications' | 'diet' | 'supplements' | 'profile'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'bills', label: 'Bills & Receipts', icon: '📄' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'diet', label: 'My Diet Plan', icon: '🍎' },
    { id: 'supplements', label: 'Supplement Store', icon: '💊' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  useEffect(() => {
    const fetchMemberData = async () => {
      if (!user) return;
      
      try {
        console.log('MemberDashboard: Fetching member data for user:', user.id);
        
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
          console.error('MemberDashboard: Error fetching member data:', error);
          
          // If user has MEMBER role but no member record exists, create one
          if (userProfile?.role === 'MEMBER' && error.code === 'PGRST116') {
            console.log('MemberDashboard: User has MEMBER role but no member record, creating one...');
            
            const memberData = {
              user_id: user.id,
              join_date: new Date().toISOString().split('T')[0],
              status: 'INACTIVE'
            };
            
            const { data: newMember, error: createError } = await supabase
              .from('members')
              .insert(memberData)
              .select(`
                *,
                user:users(*),
                fee_package:fee_packages(*)
              `)
              .single();
              
            if (createError) {
              console.error('MemberDashboard: Error creating member record:', createError);
            } else {
              console.log('MemberDashboard: Member record created successfully:', newMember);
              setMember(newMember);
            }
          }
        } else {
          console.log('MemberDashboard: Member data fetched successfully:', members);
          setMember(members);
        }
      } catch (error) {
        console.error('MemberDashboard: Unexpected error fetching member data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberData();
  }, [user, userProfile]);

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
      
      <div className="relative z-10 min-h-screen">
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Navigation Menu */}
        <div className={`
          fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden z-50
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Menu</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <nav className="mt-4 px-3">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium transition-colors touch-manipulation ${
                    activeSection === item.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* Header */}
        <header className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                {/* Profile Photo */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                  {(member?.user?.profile_photo_url || userProfile?.profile_photo_url) ? (
                    <img 
                      src={member?.user?.profile_photo_url || userProfile?.profile_photo_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm sm:text-lg">
                        {(member?.user?.full_name || userProfile?.full_name || user?.email)?.charAt(0)?.toUpperCase() || 'M'}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">Member Dashboard</h1>
                  <p className="text-sm sm:text-base text-gray-600 truncate">
                    Welcome back, <span className="font-semibold text-blue-600">{member?.user?.full_name || userProfile?.full_name || user?.email || 'Member'}</span>
                  </p>
                </div>
              </div>
              
              <button
                onClick={signOut}
                className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base flex-shrink-0 ml-2"
              >
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Desktop Navigation - Hidden on Mobile */}
        <nav className="hidden lg:block bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-[88px] z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8 overflow-x-auto">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as any)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
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
        <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Membership Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {/* Status Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 lg:p-6">
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
                    <div className="ml-3 lg:ml-4 min-w-0">
                      <h3 className="text-base lg:text-lg font-medium text-gray-900">Status</h3>
                      <p className={`text-sm font-semibold truncate ${
                        member?.status === 'ACTIVE' ? 'text-green-600' :
                        member?.status === 'INACTIVE' ? 'text-yellow-600' :
                        member?.status === 'EXPIRED' ? 'text-red-600' :
                        userProfile?.role === 'MEMBER' ? 'text-blue-600' :
                        'text-gray-600'
                      }`}>
                        {member?.status || (userProfile?.role === 'MEMBER' ? 'Pending Setup' : 'Unknown')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Package Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 lg:p-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div className="ml-3 lg:ml-4 min-w-0">
                      <h3 className="text-base lg:text-lg font-medium text-gray-900">Package</h3>
                      <p className="text-sm text-blue-600 font-semibold truncate">
                        {member?.fee_package?.name || 'No Package'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Join Date Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 lg:p-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-3 lg:ml-4 min-w-0">
                      <h3 className="text-base lg:text-lg font-medium text-gray-900">Member Since</h3>
                      <p className="text-sm text-purple-600 font-semibold truncate">
                        {member?.join_date ? new Date(member.join_date).toLocaleDateString() : 
                         userProfile?.role === 'MEMBER' ? new Date().toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expiry Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 lg:p-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3 lg:ml-4 min-w-0">
                      <h3 className="text-base lg:text-lg font-medium text-gray-900">Expires</h3>
                      <p className="text-sm text-orange-600 font-semibold truncate">
                        {member?.membership_end_date ? new Date(member.membership_end_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Membership Details */}
              {member?.fee_package && (
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 lg:p-6">
                  <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4">Current Membership Package</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    <div>
                      <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-2">{member.fee_package.name}</h3>
                      <p className="text-gray-600 mb-4 text-sm lg:text-base">{member.fee_package.description}</p>
                      <div className="flex items-center space-x-4">
                        <span className="text-xl lg:text-2xl font-bold text-green-600">₹{member.fee_package.amount}</span>
                        <span className="text-gray-500 text-sm lg:text-base">/ {member.fee_package.duration_months} month(s)</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm lg:text-base font-semibold text-gray-800 mb-2">Package Features</h4>
                      <ul className="space-y-1">
                        {member.fee_package.features?.map((feature, index) => (
                          <li key={index} className="flex items-center text-xs lg:text-sm text-gray-600">
                            <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

              {/* New Member Welcome Message */}
              {userProfile?.role === 'MEMBER' && !member?.fee_package && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 lg:p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Welcome to the Gym!</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>Your membership account has been created successfully. An admin will review your application and assign you a membership package soon.</p>
                        <p className="mt-2">You'll receive a notification once your membership is activated and you can start using all gym facilities.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 lg:p-6">
                <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                  <button
                    onClick={() => setActiveSection('bills')}
                    className="flex items-center p-3 lg:p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
                  >
                    <svg className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-900 text-sm lg:text-base">View Bills</div>
                      <div className="text-xs lg:text-sm text-gray-500">Check payment history</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveSection('notifications')}
                    className="flex items-center p-3 lg:p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors text-left"
                  >
                    <svg className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h10V9H4v2z" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-900 text-sm lg:text-base">Notifications</div>
                      <div className="text-xs lg:text-sm text-gray-500">View gym updates</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveSection('profile')}
                    className="flex items-center p-3 lg:p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left sm:col-span-2 lg:col-span-1"
                  >
                    <svg className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-900 text-sm lg:text-base">Update Profile</div>
                      <div className="text-xs lg:text-sm text-gray-500">Manage your information</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bills & Receipts Section */}
          {activeSection === 'bills' && (
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 lg:p-6">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-6">Bills & Receipts</h2>
              {member ? (
                <BillsAndReceipts memberId={member.id} />
              ) : loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading member information...</span>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No bills and receipts</h3>
                  <p className="mt-1 text-sm text-gray-500">You don't have any bills or receipts yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 lg:p-6">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-6">Notifications</h2>
              {member ? (
                <MemberNotifications memberId={member.id} />
              ) : loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading member information...</span>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h10V9H4v2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                  <p className="mt-1 text-sm text-gray-500">You don't have any notifications yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Diet Plan Section */}
          {activeSection === 'diet' && (
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 lg:p-6">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-6">My Diet Plan</h2>
              {member ? (
                <MemberDietPlan memberId={member.id} />
              ) : loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading member information...</span>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No diet plan</h3>
                  <p className="mt-1 text-sm text-gray-500">You don't have a diet plan assigned yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Supplement Store Section */}
          {activeSection === 'supplements' && (
            <div>
              <SupplementStore />
            </div>
          )}

          {/* Profile Management Section */}
          {activeSection === 'profile' && (
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 lg:p-6">
                Profile Management
              </h2>
              {member ? (
                <MemberProfile 
                  member={member} 
                  onMemberUpdate={(updatedMember) => setMember(updatedMember)}
                />
              ) : loading ? (
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 lg:p-6">
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading member information...</span>
                  </div>
                </div>
              ) : userProfile ? (
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 lg:p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Full Name</label>
                          <p className="mt-1 text-sm text-gray-900">{userProfile.full_name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <p className="mt-1 text-sm text-gray-900">{userProfile.email}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Account Type</label>
                          <p className="mt-1 text-sm text-gray-900">{userProfile.role}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <p className="mt-1 text-sm text-blue-600">Membership Pending Setup</p>
                        </div>
                      </div>
                    </div>
                    
                    {userProfile.role === 'MEMBER' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex">
                          <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-blue-800">Membership Setup in Progress</h4>
                            <p className="text-sm text-blue-700 mt-1">
                              Your membership is being processed. An admin will assign you a membership package and activate your account soon.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 lg:p-6">
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Profile not found</h3>
                    <p className="mt-1 text-sm text-gray-500">Unable to load your profile information.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};