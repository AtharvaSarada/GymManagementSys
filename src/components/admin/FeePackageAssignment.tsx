import React, { useState, useEffect } from 'react';
import { MemberService } from '../../services/memberService';
import { FeePackageService } from '../../services/feePackageService';
import { BillingService } from '../../services/billingService';
import type { Member, FeePackage } from '../../types/database';

interface FeePackageAssignmentProps {
  member: Member;
  onAssigned: () => void;
  onCancel: () => void;
}

export const FeePackageAssignment: React.FC<FeePackageAssignmentProps> = ({
  member,
  onAssigned,
  onCancel
}) => {
  const [feePackages, setFeePackages] = useState<FeePackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPackages, setLoadingPackages] = useState(true);

  useEffect(() => {
    loadFeePackages();
  }, []);

  const loadFeePackages = async () => {
    try {
      setLoadingPackages(true);
      const packages = await FeePackageService.getActiveFeePackages();
      setFeePackages(packages);
      
      // Pre-select current package if member has one
      if (member.fee_package_id) {
        setSelectedPackageId(member.fee_package_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fee packages');
    } finally {
      setLoadingPackages(false);
    }
  };

  const handleAssignPackage = async () => {
    if (!selectedPackageId) {
      setError('Please select a fee package');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Update member with fee package
      await MemberService.updateMember(member.id, {
        fee_package_id: selectedPackageId,
        status: 'INACTIVE' // Will be activated when bill is paid
      });

      // Create bill for the package
      const bill = await BillingService.createBill(member.id, selectedPackageId);

      // Create bill pending notification
      const selectedPackage = feePackages.find(pkg => pkg.id === selectedPackageId);
      if (selectedPackage) {
        await BillingService.createBillPendingNotification(
          member.id,
          bill.id,
          selectedPackage.name,
          selectedPackage.amount
        );
      }

      onAssigned();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign package');
    } finally {
      setLoading(false);
    }
  };

  const selectedPackage = feePackages.find(pkg => pkg.id === selectedPackageId);

  if (loadingPackages) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">Loading fee packages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Assign Fee Package to {member.user?.full_name}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
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
            </div>
          </div>
        )}

        {/* Member Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {member.user?.profile_photo_url ? (
                <img
                  className="h-12 w-12 rounded-full object-cover"
                  src={member.user.profile_photo_url}
                  alt={member.user.full_name || 'Profile'}
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                  <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900">{member.user?.full_name}</h4>
              <p className="text-sm text-gray-500">Membership: {member.membership_number}</p>
              <p className="text-sm text-gray-500">
                Current Status: 
                <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                  member.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  member.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                  member.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {member.status}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Current Package Info */}
        {member.fee_package && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Current Package</h4>
            <div className="text-sm text-blue-800">
              <p className="font-medium">{member.fee_package.name}</p>
              <p>₹{member.fee_package.amount} / {member.fee_package.duration_months} month{member.fee_package.duration_months !== 1 ? 's' : ''}</p>
              {member.membership_end_date && (
                <p>Expires: {new Date(member.membership_end_date).toLocaleDateString('en-IN')}</p>
              )}
            </div>
          </div>
        )}

        {/* Package Selection */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Select Fee Package</h4>
          
          {feePackages.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">No fee packages available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feePackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPackageId === pkg.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPackageId(pkg.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="feePackage"
                          value={pkg.id}
                          checked={selectedPackageId === pkg.id}
                          onChange={() => setSelectedPackageId(pkg.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label className="ml-3 text-sm font-medium text-gray-900">
                          {pkg.name}
                        </label>
                      </div>
                      <div className="mt-2 ml-7">
                        <p className="text-sm text-gray-500">{pkg.description}</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          ₹{pkg.amount}
                          <span className="text-sm font-normal text-gray-500">
                            / {pkg.duration_months} month{pkg.duration_months !== 1 ? 's' : ''}
                          </span>
                        </p>
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">Features:</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {pkg.features.slice(0, 3).map((feature, index) => (
                              <li key={index} className="flex items-center">
                                <svg className="w-3 h-3 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {feature}
                              </li>
                            ))}
                            {pkg.features.length > 3 && (
                              <li className="text-gray-500">+{pkg.features.length - 3} more...</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Package Details */}
        {selectedPackage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-900 mb-2">Assignment Summary</h4>
            <div className="text-sm text-green-800 space-y-1">
              <p>Package: <span className="font-medium">{selectedPackage.name}</span></p>
              <p>Amount: <span className="font-medium">₹{selectedPackage.amount}</span></p>
              <p>Duration: <span className="font-medium">{selectedPackage.duration_months} month{selectedPackage.duration_months !== 1 ? 's' : ''}</span></p>
              <p className="text-xs text-green-700 mt-2">
                • A bill will be generated for ₹{selectedPackage.amount}<br/>
                • Member status will be set to INACTIVE until payment is marked as paid<br/>
                • Member will receive a notification about the pending payment
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssignPackage}
            disabled={loading || !selectedPackageId}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {loading ? 'Assigning...' : 'Assign Package & Generate Bill'}
          </button>
        </div>
      </div>
    </div>
  );
};