import React, { useState, useEffect } from 'react';
import { gymInfoService } from '../../services/gymInfoService';
import type { GymHours as GymHoursType } from '../../services/gymInfoService';

export const GymHours: React.FC = () => {
  const [hours, setHours] = useState<GymHoursType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHours = async () => {
      try {
        const gymHours = await gymInfoService.getGymHours();
        setHours(gymHours);
      } catch (error) {
        console.error('Error loading gym hours:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHours();
  }, []);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getCurrentDayStatus = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayHours = hours.find(h => h.day === today);
    
    if (!todayHours || !todayHours.isOpen) {
      return { isOpen: false, message: 'Closed today' };
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [openHour, openMin] = todayHours.openTime.split(':').map(Number);
    const [closeHour, closeMin] = todayHours.closeTime.split(':').map(Number);
    
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    if (currentTime >= openTime && currentTime <= closeTime) {
      return { 
        isOpen: true, 
        message: `Open until ${formatTime(todayHours.closeTime)}` 
      };
    } else if (currentTime < openTime) {
      return { 
        isOpen: false, 
        message: `Opens at ${formatTime(todayHours.openTime)}` 
      };
    } else {
      return { 
        isOpen: false, 
        message: 'Closed for today' 
      };
    }
  };

  if (loading) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentStatus = getCurrentDayStatus();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-medium text-gray-900">Operating Hours</h3>
          <div className="flex items-center mt-1">
            <div className={`w-2 h-2 rounded-full mr-2 ${currentStatus.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`text-sm font-medium ${currentStatus.isOpen ? 'text-green-700' : 'text-red-700'}`}>
              {currentStatus.message}
            </span>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        {hours.map((dayHours) => (
          <div 
            key={dayHours.day} 
            className={`flex justify-between items-center py-2 px-3 rounded-lg ${
              dayHours.day === today ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
            }`}
          >
            <span className={`font-medium ${dayHours.day === today ? 'text-blue-900' : 'text-gray-700'}`}>
              {dayHours.day}
              {dayHours.day === today && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Today
                </span>
              )}
            </span>
            <span className={`text-sm ${dayHours.day === today ? 'text-blue-700' : 'text-gray-600'}`}>
              {dayHours.isOpen 
                ? `${formatTime(dayHours.openTime)} - ${formatTime(dayHours.closeTime)}`
                : 'Closed'
              }
            </span>
          </div>
        ))}
      </div>

      {/* Special Hours Notice */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <svg className="w-4 h-4 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-xs font-medium text-yellow-800">Holiday Hours</p>
            <p className="text-xs text-yellow-700">
              Special hours may apply during holidays. Please call ahead to confirm.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};