import React, { useState, useEffect } from 'react';
import { MemberService } from '../../services/memberService';
import { MemberList } from './MemberList';
import { MemberForm } from './MemberForm';
import { FeePackageAssignment } from './FeePackageAssignment';
import type { Member } from '../../types/database';

type ViewMode = 'list' | 'create' | 'edit' | 'details' | 'assign-package';

export const MemberManagement: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      console.log('MemberManagement: Loading members...');
      const data = await MemberService.getAllMembers();
      console.log('MemberManagement: Loaded members:', data.length);
      setMembers(data);
    } catch (err) {
      console.error('MemberManagement: Error loading members:', err);
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      loadMembers();
      return;
    }

    try {
      setLoading(true);
      // For now, just filter the existing members
      const allMembers = await MemberService.getAllMembers();
      const filtered = allMembers.filter(member => 
        member.user?.full_name?.toLowerCase().includes(query.toLowerCase()) ||
        member.user?.email?.toLowerCase().includes(query.toLowerCase()) ||
        member.membership_number?.toLowerCase().includes(query.toLowerCase())
      );
      setMembers(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Member Management</h2>
          <p className="text-gray-600">Manage gym members and their profiles</p>
        </div>
        {viewMode === 'list' && (
          <button
            onClick={handleCreateMember}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Member</span>
          </button>
        )}
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

      {/* Content based on view mode */}
      {viewMode === 'list' && (
        <MemberList
          members={members}
          searchQuery={searchQuery}
          onSearch={handleSearch}
          onEdit={handleEditMember}
          onView={handleViewMember}
          onDelete={handleDeleteMember}
          onAssignPackage={handleAssignPackage}
          loading={loading}
        />
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