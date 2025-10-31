import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GymInfoSearch } from '../components/user/GymInfoSearch';
import { GymInfoDisplay } from '../components/user/GymInfoDisplay';
import { GymHours } from '../components/user/GymHours';
import { GymStats } from '../components/user/GymStats';
import { SupplementStore } from '../components/shared/SupplementStore';
import { BecomeMemberModal } from '../components/user/BecomeMemberModal';
import { gymInfoService } from '../services/gymInfoService';

export const UserDashboard: React.FC = () => {
  const { userProfile, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<'gym-info' | 'supplements'>('gym-info');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [defaultData, setDefaultData] = useState<any>({
    services: [],
    facilities: [],
    feePackages: [],
    contact: null
  });
  const [loading, setLoading] = useState(true);
  const [showBecomeMemberModal, setShowBecomeMemberModal] = useState(false);

  useEffect(() => {
    const loadDefaultData = async () => {
      try {
        console.log('UserDashboard: Loading gym information...');
        const [services, facilities, feePackages, contact] = await Promise.all([
          gymInfoService.getGymServices(),
          gymInfoService.getGymFacilities(),
          gymInfoService.getPublicFeePackages(),
          gymInfoService.getGymContact()
        ]);

        setDefaultData({
          services,
          facilities,
          feePackages,
          contact
        });
        console.log('UserDashboard: Gym information loaded successfully');
      } catch (error) {
        console.error('UserDashboard: Error loading gym information:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDefaultData();
  }, []);

  const handleSearchResults = (results: any) => {
    setSearchResults(results);
  };

  const displayData = searchResults || defaultData;

  const handleBecomeMemberSuccess = () => {
    // Refresh the page to update user role and redirect to member dashboard
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-800 to-blue-900">
      {/* Gym information background overlay */}
      <div className="absolute inset-0 bg-black/40"></div>
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M0 0h80v80H0V0zm20 20v40h40V20H20zm20 35a15 15 0 1 1 0-30 15 15 0 0 1 0 30z' fill-opacity='0.05'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-sm shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4 sm:py-6">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                  {activeSection === 'gym-info' ? 'Gym Information' : 'Supplement Store'}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 truncate">Welcome, {userProfile?.full_name}</p>
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

        {/* Navigation */}
        <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-4 sm:space-x-8">
              {[
                { id: 'gym-info', label: 'Gym Information', icon: '🏋️', shortLabel: 'Gym Info' },
                { id: 'supplements', label: 'Supplement Store', icon: '💊', shortLabel: 'Supplements' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as any)}
                  className={`flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                    activeSection === item.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-sm sm:text-base">{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.shortLabel}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {activeSection === 'gym-info' && (
            <>
              {/* Search Component */}
              <div className="mb-8">
                <GymInfoSearch onSearchResults={handleSearchResults} />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading gym information...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Gym Stats - Only show when not searching */}
                  {!searchResults && (
                    <GymStats />
                  )}
                  
                  {/* Main Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                      <GymHours />
                    </div>
                    <div className="lg:col-span-2">
                      {/* Search Results or Default Information */}
                      <GymInfoDisplay
                        services={displayData.services}
                        facilities={displayData.facilities}
                        feePackages={displayData.feePackages}
                        contact={displayData.contact}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Call to Action - Only show for USER role */}
              {userProfile?.role === 'USER' && (
                <div className="mt-8 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-8 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h2 className="text-2xl font-bold text-gray-900">Ready to Join Our Gym?</h2>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Upgrade to a member account to access exclusive features, track your progress, and manage your membership.
                  </p>
                  <div className="space-y-3">
                    <button 
                      onClick={() => setShowBecomeMemberModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Become a Member
                    </button>
                    <p className="text-sm text-gray-500">
                      Choose from flexible membership plans starting from ₹1,500/month
                    </p>
                  </div>
                </div>
              )}

              {/* Member Status - Show for MEMBER role */}
              {userProfile?.role === 'MEMBER' && (
                <div className="mt-8 bg-green-50 border border-green-200 rounded-xl shadow-lg p-8 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-2xl font-bold text-green-900">You're a Member!</h2>
                  </div>
                  <p className="text-green-700 mb-6">
                    Welcome to our gym community! Access your member dashboard to manage your membership, view bills, and track your progress.
                  </p>
                  <button 
                    onClick={() => window.location.href = '/member'}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                  >
                    Go to Member Dashboard
                  </button>
                </div>
              )}
            </>
          )}

          {activeSection === 'supplements' && (
            <div className="mt-[-2rem]">
              <SupplementStore />
            </div>
          )}
        </main>

        {/* Become Member Modal */}
        <BecomeMemberModal
          isOpen={showBecomeMemberModal}
          onClose={() => setShowBecomeMemberModal(false)}
          onSuccess={handleBecomeMemberSuccess}
        />
      </div>
    </div>
  );
};