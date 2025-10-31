import React, { useState, useEffect } from 'react';
import { MemberService } from '../../services/memberService';
import { MemberForm } from './MemberForm';
import { FeePackageAssignment } from './FeePackageAssignment';
import type { Member } from '../../types/database';

type ViewMode = 'list' | 'create' | 'edit' | 'details' | 'assign-package';

export const MemberManagement: React.FC = () => {
  const [memberUsers, setMemberUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load members on component mount
  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      setSyncMessage(null);
      console.log('MemberManagement: Loading all member users...');
      
      // Load all users with MEMBER role (including those without member records)
      const allMemberUsers = await MemberService.getAllMemberUsers();
      console.log('MemberManagement: Loaded member users:', allMemberUsers.length);
      setMemberUsers(allMemberUsers);
      
    } catch (err) {
      console.error('MemberManagement: Error loading members:', err);
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncMissingMembers = async () => {
    try {
      setSyncing(true);
      setError(null);
      setSyncMessage(null);
      
      console.log('MemberManagement: Starting sync of missing member records...');
      const result = await MemberService.syncMissingMemberRecords();
      
      if (result.created > 0) {
        setSyncMessage(`Successfully created ${result.created} member records: ${result.createdMembers.join(', ')}`);
        // Reload the data
        await loadMembers();
      } else {
        setSyncMessage('All member users already have member records. No sync needed.');
      }
      
      if (result.errors.length > 0) {
        setError(`Some errors occurred during sync: ${result.errors.join('; ')}`);
      }
      
    } catch (err) {
      console.error('MemberManagement: Error syncing members:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync member records');
    } finally {
      setSyncing(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Search is now handled in the render function by filtering memberUsers
  };

  const handleCreateMember = () => {
    setSelectedMember(null);
    setViewMode('create');
  };

  const handleEditMember = (member: Member) => {
    setSelectedMember(member);
    setViewMode('edit');
  };

  const handleViewMember = (member: Member) => {
    setSelectedMember(member);
    setViewMode('details');
  };

  const handleDeleteMember = async (member: Member) => {
    if (!confirm(`Are you sure you want to delete member ${member.user?.full_name || member.membership_number}? This action cannot be undone.`)) {
      return;
    }

    try {
      await MemberService.deleteMember(member.id);
      await loadMembers(); // Reload the list
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete member');
    }
  };



  const handleBackToList = () => {
    setViewMode('list');
    setSelectedMember(null);
  };

  const handleAssignPackage = (member: Member) => {
    setSelectedMember(member);
    setViewMode('assign-package');
  };

  const handleMemberSaved = async () => {
    console.log('MemberManagement: Member saved, refreshing list...');
    try {
      // Small delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadMembers();
      console.log('MemberManagement: Member list refreshed successfully');
      handleBackToList();
    } catch (error) {
      console.error('MemberManagement: Error refreshing member list:', error);
      setError('Failed to refresh member list');
    }
  };

  const handlePackageAssigned = async () => {
    await loadMembers();
    handleBackToList();
  };

  if (loading && viewMode === 'list') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Member Management</h2>
          <p className="text-gray-600 mt-1 leading-relaxed">
            Manage gym members and their profiles 
            {memberUsers.length > 0 && (
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {memberUsers.length} total member users
              </span>
            )}
          </p>
        </div>
        
        {viewMode === 'list' && (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-3">
            <button
              onClick={handleSyncMissingMembers}
              disabled={syncing}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors w-full sm:w-auto"
            >
              {syncing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Sync Members</span>
                </>
              )}
            </button>
            <button
              onClick={handleCreateMember}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors w-full sm:w-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Success Message */}
      {syncMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-green-800">{syncMessage}</p>
            </div>
            <button
              onClick={() => setSyncMessage(null)}
              className="ml-auto text-green-400 hover:text-green-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

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

      {/* Content based on view mode */}
      {viewMode === 'list' && (
        <>
          {/* Show all member users */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
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
                      onChange={(e) => handleSearch(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {memberUsers.length} member user{memberUsers.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Member Users Table */}
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <p className="mt-2 text-sm text-gray-500">Loading members...</p>
                        </div>
                      </td>
                    </tr>
                  ) : memberUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
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
                    memberUsers
                      .filter(user => {
                        if (!searchQuery.trim()) return true;
                        const query = searchQuery.toLowerCase();
                        return (
                          user.full_name?.toLowerCase().includes(query) ||
                          user.email?.toLowerCase().includes(query) ||
                          user.member?.membership_number?.toLowerCase().includes(query)
                        );
                      })
                      .map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {user.profile_photo_url ? (
                                  <img
                                    className="h-10 w-10 rounded-full object-cover"
                                    src={user.profile_photo_url}
                                    alt={user.full_name || 'Profile'}
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
                                  {user.full_name || 'N/A'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.email || 'N/A'}
                                </div>
                                {user.phone && (
                                  <div className="text-sm text-gray-500">
                                    {user.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {user.member?.membership_number || (
                                <span className="text-red-600 font-medium">Missing Record</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.member?.join_date ? (
                                `Member since ${new Date(user.member.join_date).toLocaleDateString()}`
                              ) : (
                                <span className="text-red-500">No member record</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.member?.status ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.member.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                user.member.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                                user.member.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {user.member.status}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Needs Setup
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {user.member?.fee_package?.name || 'No package assigned'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.member?.fee_package ? (
                                <span>₹{user.member.fee_package.amount}/{user.member.fee_package.duration_months} month{user.member.fee_package.duration_months !== 1 ? 's' : ''}</span>
                              ) : (
                                <span className="text-gray-400">No package</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              {user.member ? (
                                <>
                                  <button
                                    onClick={() => handleViewMember(user.member)}
                                    className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                    title="View Details"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleAssignPackage(user.member)}
                                    className="text-green-600 hover:text-green-900 p-1 rounded"
                                    title="Assign Package"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleEditMember(user.member)}
                                    className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                                    title="Edit Member"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMember(user.member)}
                                    className="text-red-600 hover:text-red-900 p-1 rounded"
                                    title="Delete Member"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </>
                              ) : (
                                <span className="text-sm text-red-600 font-medium">
                                  Missing member record - Use Sync Members button
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {(viewMode === 'create' || viewMode === 'edit') && (
        <MemberForm
          member={viewMode === 'edit' ? selectedMember : null}
          onSave={handleMemberSaved}
          onCancel={handleBackToList}
        />
      )}

      {viewMode === 'assign-package' && selectedMember && (
        <FeePackageAssignment
          member={selectedMember}
          onAssigned={handlePackageAssigned}
          onCancel={handleBackToList}
        />
      )}

      {viewMode === 'details' && selectedMember && (
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Member Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Membership Number</label>
              <p className="text-sm text-gray-900">{selectedMember.membership_number}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="text-sm text-gray-900">{selectedMember.user?.full_name || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="text-sm text-gray-900">{selectedMember.user?.email || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <p className="text-sm text-gray-900">{selectedMember.user?.phone || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <p className="text-sm text-gray-900">{selectedMember.status}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Join Date</label>
              <p className="text-sm text-gray-900">{new Date(selectedMember.join_date).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fee Package</label>
              <p className="text-sm text-gray-900">{selectedMember.fee_package?.name || 'No package assigned'}</p>
            </div>
            {selectedMember.membership_start_date && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Membership Period</label>
                <p className="text-sm text-gray-900">
                  {new Date(selectedMember.membership_start_date).toLocaleDateString()} - {' '}
                  {selectedMember.membership_end_date ? new Date(selectedMember.membership_end_date).toLocaleDateString() : 'Ongoing'}
                </p>
              </div>
            )}
          </div>
          <div className="mt-6 flex space-x-3">
            <button
              onClick={handleBackToList}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Back to List
            </button>
            <button
              onClick={() => handleAssignPackage(selectedMember)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Assign Package
            </button>
          </div>
        </div>
      )}
    </div>
  );
};