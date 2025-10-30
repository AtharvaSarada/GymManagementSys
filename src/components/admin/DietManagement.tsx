import React, { useState, useEffect } from 'react';
import { DietService } from '../../services/dietService';
import { MemberService } from '../../services/memberService';
import { useAuth } from '../../contexts/AuthContext';
import type { DietPlan, MemberDietAssignment, Member } from '../../types/database';

export const DietManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'plans' | 'assignments' | 'assign'>('plans');
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [assignments, setAssignments] = useState<MemberDietAssignment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Assignment form state
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [selectedDietPlan, setSelectedDietPlan] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, assignmentsData, membersData] = await Promise.all([
        DietService.getAllDietPlans(),
        DietService.getAllDietAssignments(),
        MemberService.getAllMembers()
      ]);

      setDietPlans(plansData);
      setAssignments(assignmentsData);
      setMembers(membersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDiet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedMember || !selectedDietPlan) return;

    setAssigning(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await DietService.assignDietToMember(
        selectedMember,
        selectedDietPlan,
        user.id,
        assignmentNotes || undefined,
        endDate || undefined
      );

      if (result.success) {
        setSuccess(result.message);
        // Reset form
        setSelectedMember('');
        setSelectedDietPlan('');
        setAssignmentNotes('');
        setEndDate('');
        // Reload assignments
        const updatedAssignments = await DietService.getAllDietAssignments();
        setAssignments(updatedAssignments);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusUpdate = async (assignmentId: string, status: 'COMPLETED' | 'CANCELLED') => {
    try {
      const result = await DietService.updateDietAssignmentStatus(assignmentId, status);
      if (result.success) {
        setSuccess(result.message);
        // Reload assignments
        const updatedAssignments = await DietService.getAllDietAssignments();
        setAssignments(updatedAssignments);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const getGoalBadgeColor = (goal: string) => {
    switch (goal) {
      case 'fat_loss': return 'bg-red-100 text-red-800';
      case 'muscle_gain': return 'bg-blue-100 text-blue-800';
      case 'weight_gain': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading diet management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Diet Management</h2>
          <p className="text-gray-600">Manage diet plans and member assignments</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
            <button onClick={() => setSuccess(null)} className="ml-auto text-green-400 hover:text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'plans', label: 'Diet Plans', icon: '🍎' },
              { id: 'assign', label: 'Assign Diet', icon: '👥' },
              { id: 'assignments', label: 'Active Assignments', icon: '📋' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Diet Plans Tab */}
          {activeTab === 'plans' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Available Diet Plans</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dietPlans.map((plan) => (
                  <div key={plan.id} className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGoalBadgeColor(plan.goal)}`}>
                        {plan.goal.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{plan.daily_calories}</div>
                        <div className="text-xs text-gray-500">Calories/day</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{plan.protein_grams}g</div>
                        <div className="text-xs text-gray-500">Protein</div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      <div className="font-medium mb-2">Meals: {plan.meals.length}</div>
                      <div className="space-y-1">
                        {plan.meals.slice(0, 3).map((meal, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{meal.name}</span>
                            <span>{meal.calories} cal</span>
                          </div>
                        ))}
                        {plan.meals.length > 3 && (
                          <div className="text-gray-400">+{plan.meals.length - 3} more meals</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assign Diet Tab */}
          {activeTab === 'assign' && (
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Assign Diet Plan to Member</h3>
              
              <form onSubmit={handleAssignDiet} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Member *
                  </label>
                  <select
                    required
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a member...</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.user?.full_name} ({member.membership_number}) - {member.user?.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Diet Plan *
                  </label>
                  <select
                    required
                    value={selectedDietPlan}
                    onChange={(e) => setSelectedDietPlan(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a diet plan...</option>
                    {dietPlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} ({plan.goal.replace('_', ' ')}) - {plan.daily_calories} cal/day
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment Notes
                  </label>
                  <textarea
                    rows={3}
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    placeholder="Add any specific instructions or notes for the member..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={assigning || !selectedMember || !selectedDietPlan}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {assigning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Assigning Diet...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Assign Diet Plan</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Diet Assignments ({assignments.length})</h3>
              
              {assignments.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">No diet assignments found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diet Plan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {assignments.map((assignment) => (
                        <tr key={assignment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {assignment.member?.user?.full_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {assignment.member?.membership_number}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {assignment.diet_plan?.name}
                              </div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGoalBadgeColor(assignment.diet_plan?.goal || '')}`}>
                                {assignment.diet_plan?.goal?.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(assignment.assigned_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(assignment.status)}`}>
                              {assignment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {assignment.status === 'ACTIVE' && (
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => handleStatusUpdate(assignment.id, 'COMPLETED')}
                                  className="text-green-600 hover:text-green-900 p-1"
                                  title="Mark as Completed"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(assignment.id, 'CANCELLED')}
                                  className="text-red-600 hover:text-red-900 p-1"
                                  title="Cancel Assignment"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};