import React, { useState, useEffect } from 'react';
import { DietService } from '../../services/dietService';
import type { MemberDietAssignment, DietMeal } from '../../types/database';

interface MemberDietPlanProps {
  memberId: string;
}

export const MemberDietPlan: React.FC<MemberDietPlanProps> = ({ memberId }) => {
  const [dietAssignment, setDietAssignment] = useState<MemberDietAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<DietMeal | null>(null);

  useEffect(() => {
    loadDietAssignment();
  }, [memberId]);

  const loadDietAssignment = async () => {
    try {
      setLoading(true);
      const assignment = await DietService.getMemberCurrentDiet(memberId);
      setDietAssignment(assignment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load diet plan');
    } finally {
      setLoading(false);
    }
  };

  const getGoalIcon = (goal: string) => {
    switch (goal) {
      case 'fat_loss': return '🔥';
      case 'muscle_gain': return '💪';
      case 'weight_gain': return '📈';
      default: return '🍎';
    }
  };

  const getGoalColor = (goal: string) => {
    switch (goal) {
      case 'fat_loss': return 'from-red-500 to-orange-500';
      case 'muscle_gain': return 'from-blue-500 to-purple-500';
      case 'weight_gain': return 'from-green-500 to-teal-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading your diet plan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!dietAssignment || !dietAssignment.diet_plan) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Diet Plan Assigned</h3>
        <p className="text-gray-600">
          You don't have an active diet plan yet. Contact your trainer or gym admin to get a personalized diet plan assigned to you.
        </p>
      </div>
    );
  }

  const { diet_plan } = dietAssignment;

  return (
    <div className="space-y-6">
      {/* Diet Plan Header */}
      <div className={`bg-gradient-to-r ${getGoalColor(diet_plan.goal)} rounded-xl p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-3xl">{getGoalIcon(diet_plan.goal)}</span>
              <h2 className="text-2xl font-bold">{diet_plan.name}</h2>
            </div>
            <p className="text-white/90 mb-4">{diet_plan.description}</p>
            <div className="flex items-center space-x-4 text-sm">
              <span>Assigned: {new Date(dietAssignment.assigned_date).toLocaleDateString()}</span>
              {dietAssignment.end_date && (
                <span>Until: {new Date(dietAssignment.end_date).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nutrition Overview */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Nutrition Targets</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{diet_plan.daily_calories}</div>
            <div className="text-sm text-gray-600">Calories</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{diet_plan.protein_grams}g</div>
            <div className="text-sm text-gray-600">Protein</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{diet_plan.carbs_grams}g</div>
            <div className="text-sm text-gray-600">Carbs</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{diet_plan.fat_grams}g</div>
            <div className="text-sm text-gray-600">Fats</div>
          </div>
        </div>
      </div>

      {/* Daily Meal Plan */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Daily Meal Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {diet_plan.meals.map((meal, index) => (
            <div
              key={index}
              onClick={() => setSelectedMeal(meal)}
              className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-gray-900">{meal.name}</h4>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {meal.time}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-3">
                <div className="font-medium text-green-600">{meal.calories} calories</div>
                <div className="text-xs text-gray-500">{meal.foods.length} items</div>
              </div>
              <div className="text-xs text-gray-500">
                {meal.foods.slice(0, 2).map((food, foodIndex) => (
                  <div key={foodIndex}>• {food}</div>
                ))}
                {meal.foods.length > 2 && (
                  <div className="text-gray-400">+{meal.foods.length - 2} more items</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Guidelines */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Important Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {diet_plan.guidelines.map((guideline, index) => (
            <div key={index} className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-700">{guideline}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Assignment Notes */}
      {dietAssignment.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-amber-800 mb-2">Special Instructions</h3>
          <p className="text-amber-700">{dietAssignment.notes}</p>
        </div>
      )}

      {/* Meal Detail Modal */}
      {selectedMeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedMeal.name}</h3>
                <p className="text-sm text-gray-500">{selectedMeal.time} • {selectedMeal.calories} calories</p>
              </div>
              <button
                onClick={() => setSelectedMeal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Food Items:</h4>
              <div className="space-y-2">
                {selectedMeal.foods.map((food, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-700">{food}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};