import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GymInfoSearch } from '../components/user/GymInfoSearch';
import { GymInfoDisplay } from '../components/user/GymInfoDisplay';
import { GymHours } from '../components/user/GymHours';
import { GymStats } from '../components/user/GymStats';
import { SupplementStore } from '../components/shared/SupplementStore';
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
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {activeSection === 'gym-info' ? 'Gym Information' : 'Supplement Store'}
                </h1>
                <p className="text-gray-600">Welcome, {userProfile?.full_name}</p>
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
                { id: 'gym-info', label: 'Gym Information', icon: '🏋️' },
                { id: 'supplements', label: 'Supplement Store', icon: '💊' },
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

              {/* Call to Action */}
              <div className="mt-8 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Join Our Gym?</h2>
                <p className="text-gray-600 mb-6">
                  Upgrade to a member account to access exclusive features, track your progress, and manage your membership.
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">
                  Become a Member
                </button>
              </div>
            </>
          )}

          {activeSection === 'supplements' && (
            <div className="mt-[-2rem]">
              <SupplementStore />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};