import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MemberService } from '../../services/memberService';
import { FeePackageService } from '../../services/feePackageService';
import { supabase } from '../../services/supabase';
import type { FeePackage } from '../../types/database';

interface BecomeMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BecomeMemberModal: React.FC<BecomeMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { userProfile } = useAuth();
  const [step, setStep] = useState<'packages' | 'details' | 'confirmation'>('packages');
  const [selectedPackage, setSelectedPackage] = useState<FeePackage | null>(null);
  const [feePackages, setFeePackages] = useState<FeePackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Member details form
  const [memberDetails, setMemberDetails] = useState({
    phone: userProfile?.phone || '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    date_of_birth: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadFeePackages();
      setStep('packages');
      setError(null);
    }
  }, [isOpen]);

  const loadFeePackages = async () => {
    try {
      setLoading(true);
      const packages = await FeePackageService.getActiveFeePackages();
      setFeePackages(packages);
    } catch (err) {
      setError('Failed to load membership packages');
      console.error('Error loading fee packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (pkg: FeePackage) => {
    setSelectedPackage(pkg);
    setStep('details');
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('confirmation');
  };

  const handleConfirmMembership = async () => {
    if (!userProfile || !selectedPackage) return;

    try {
      setLoading(true);
      setError(null);

      // Use the MemberService to upgrade user to member (without package assignment)
      const { member } = await MemberService.upgradeUserToMember(
        userProfile.id,
        memberDetails
      );

      console.log('BecomeMemberModal: Member created successfully:', member);
      console.log('BecomeMemberModal: Selected package:', selectedPackage);

      // Create initial bill for the selected package (admin will assign package when marking as paid)
      const billData = {
        member_id: member.id,
        amount: selectedPackage.amount,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        status: 'PENDING' as const,
        fee_package_id: selectedPackage.id,
        notes: `Membership fee for ${selectedPackage.name}. Package selected during registration: ${selectedPackage.name} (${selectedPackage.duration_months} months)`
      };

      console.log('BecomeMemberModal: Creating bill with data:', billData);

      const { data: billResult, error: billError } = await supabase
        .from('bills')
        .insert(billData)
        .select()
        .single();

      if (billError) {
        console.error('BecomeMemberModal: Failed to create initial bill:', billError);
        setError(`Failed to create bill: ${billError.message}`);
        return;
      } else {
        console.log('BecomeMemberModal: Bill created successfully:', billResult);
      }

      onSuccess();
      onClose();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create membership');
      console.error('Error creating membership:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateEndDate = (durationMonths: number): string => {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);
    return endDate.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 'packages' && 'Choose Your Membership'}
            {step === 'details' && 'Complete Your Profile'}
            {step === 'confirmation' && 'Confirm Your Membership'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
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

        {/* Content */}
        <div className="p-6">
          {step === 'packages' && (
            <div className="space-y-6">
              <p className="text-gray-600">
                Select a membership package that best fits your fitness goals and budget.
              </p>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {feePackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`border border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer ${
                        selectedPackage?.id === pkg.id ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => handlePackageSelect(pkg)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">₹{pkg.amount}</div>
                          <div className="text-sm text-gray-500">
                            {pkg.duration_months} month{pkg.duration_months !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      
                      {pkg.description && (
                        <p className="text-gray-600 mb-4">{pkg.description}</p>
                      )}
                      
                      {pkg.features && pkg.features.length > 0 && (
                        <ul className="space-y-2">
                          {pkg.features.map((feature, index) => (
                            <li key={index} className="flex items-center text-sm text-gray-600">
                              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}
                      
                      <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
                        Select This Package
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'details' && selectedPackage && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900">Selected Package: {selectedPackage.name}</h3>
                <p className="text-blue-700">₹{selectedPackage.amount} for {selectedPackage.duration_months} month{selectedPackage.duration_months !== 1 ? 's' : ''}</p>
              </div>

              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={memberDetails.phone}
                    onChange={(e) => setMemberDetails(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={memberDetails.address}
                    onChange={(e) => setMemberDetails(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Enter your address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={memberDetails.date_of_birth}
                    onChange={(e) => setMemberDetails(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    value={memberDetails.emergency_contact_name}
                    onChange={(e) => setMemberDetails(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Emergency contact name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={memberDetails.emergency_contact_phone}
                    onChange={(e) => setMemberDetails(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Emergency contact phone"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep('packages')}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 'confirmation' && selectedPackage && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4">Membership Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-green-700">Package:</span>
                    <span className="font-medium text-green-900">{selectedPackage.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Duration:</span>
                    <span className="font-medium text-green-900">
                      {selectedPackage.duration_months} month{selectedPackage.duration_months !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Amount:</span>
                    <span className="font-medium text-green-900">₹{selectedPackage.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Start Date:</span>
                    <span className="font-medium text-green-900">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">End Date:</span>
                    <span className="font-medium text-green-900">
                      {new Date(calculateEndDate(selectedPackage.duration_months)).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Important:</strong> Your membership will be created with INACTIVE status. 
                      An admin will assign your selected package and activate your membership once payment is processed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  disabled={loading}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmMembership}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Membership...
                    </>
                  ) : (
                    'Confirm Membership'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};