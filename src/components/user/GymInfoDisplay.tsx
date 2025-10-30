import React from 'react';
import type { GymService } from '../../services/gymInfoService';

interface GymInfoDisplayProps {
  services?: GymService[];
  facilities?: string[];
  feePackages?: any[];
  contact?: any;
}

export const GymInfoDisplay: React.FC<GymInfoDisplayProps> = ({
  services = [],
  facilities = [],
  feePackages = [],
  contact
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'equipment':
        return (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'service':
        return (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'class':
        return (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'facility':
        return (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'equipment': return 'bg-orange-500';
      case 'service': return 'bg-blue-500';
      case 'class': return 'bg-purple-500';
      case 'facility': return 'bg-teal-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Services */}
      {services.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Services & Equipment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <div key={service.id} className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4">
                <div className="flex items-start mb-3">
                  <div className={`flex-shrink-0 w-8 h-8 ${getCategoryColor(service.category)} rounded-lg flex items-center justify-center`}>
                    {getCategoryIcon(service.category)}
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="text-md font-medium text-gray-900">{service.name}</h4>
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full mt-1 capitalize">
                      {service.category}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{service.description}</p>
                <div className="mt-2 flex items-center">
                  <div className={`w-2 h-2 rounded-full ${service.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="ml-2 text-xs text-gray-500">
                    {service.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Facilities */}
      {facilities.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Facilities</h3>
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {facilities.map((facility, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">{facility}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fee Packages */}
      {feePackages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Membership Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {feePackages.map((pkg) => (
              <div key={pkg.id} className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4">
                <div className="text-center">
                  <h4 className="text-md font-semibold text-gray-900 mb-2">{pkg.name}</h4>
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    ₹{pkg.amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500 mb-3">
                    {pkg.duration_months} month{pkg.duration_months > 1 ? 's' : ''}
                  </div>
                  {pkg.description && (
                    <p className="text-xs text-gray-600 mb-3">{pkg.description}</p>
                  )}
                  {pkg.features && pkg.features.length > 0 && (
                    <div className="text-left">
                      <div className="text-xs font-medium text-gray-700 mb-2">Features:</div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {pkg.features.slice(0, 3).map((feature: string, index: number) => (
                          <li key={index} className="flex items-center">
                            <div className="w-1 h-1 bg-blue-500 rounded-full mr-2"></div>
                            {feature}
                          </li>
                        ))}
                        {pkg.features.length > 3 && (
                          <li className="text-blue-600">+{pkg.features.length - 3} more...</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact Information */}
      {contact && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Phone</div>
                  <div className="text-sm text-gray-600">{contact.phone}</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Email</div>
                  <div className="text-sm text-gray-600">{contact.email}</div>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Address</div>
                  <div className="text-sm text-gray-600">{contact.address}</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Website</div>
                  <div className="text-sm text-gray-600">{contact.website}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};