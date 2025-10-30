import React, { useState, useRef } from 'react';
import { MemberService } from '../../services/memberService';
import type { Member } from '../../types/database';
import { FILE_CONSTRAINTS } from '../../types/database';
import { validateMemberForm, cleanPhoneNumber } from '../../utils/validation';

interface MemberFormProps {
  member?: Member | null;
  onSave: () => void;
  onCancel: () => void;
}

export const MemberForm: React.FC<MemberFormProps> = ({ member, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    // User data
    email: member?.user?.email || '',
    full_name: member?.user?.full_name || '',
    phone: member?.user?.phone || '',
    role: (member?.user?.role as 'MEMBER' | 'USER') || 'MEMBER',
    
    // Member data
    address: member?.address || '',
    emergency_contact_name: member?.emergency_contact_name || '',
    emergency_contact_phone: member?.emergency_contact_phone || '',
    date_of_birth: member?.date_of_birth ? member.date_of_birth.split('T')[0] : '',
  });

  const [profilePhotoUrl, setProfilePhotoUrl] = useState(member?.user?.profile_photo_url || '');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    
    // Handle phone number fields with validation
    if (name === 'phone' || name === 'emergency_contact_phone') {
      // Only allow digits and limit to 10 characters
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length <= 10) {
        processedValue = digitsOnly;
      } else {
        return; // Don't update if more than 10 digits
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !member) return;

    // Validate file
    if (!FILE_CONSTRAINTS.PROFILE_PHOTO.ALLOWED_TYPES.includes(file.type as any)) {
      setError('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    if (file.size > FILE_CONSTRAINTS.PROFILE_PHOTO.MAX_SIZE) {
      setError('File size must be less than 5MB');
      return;
    }

    try {
      setUploadingPhoto(true);
      setError(null);
      const photoUrl = await MemberService.uploadProfilePhoto(member.id, file);
      setProfilePhotoUrl(photoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!member || !profilePhotoUrl) return;

    if (!confirm('Are you sure you want to delete this profile photo?')) {
      return;
    }

    try {
      setUploadingPhoto(true);
      await MemberService.deleteProfilePhoto(member.id);
      setProfilePhotoUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setValidationErrors({});

    // Validate form data
    const validation = validateMemberForm({
      email: formData.email,
      full_name: formData.full_name,
      phone: formData.phone,
      emergency_contact_phone: formData.emergency_contact_phone,
    });

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setLoading(false);
      return;
    }

    try {
      if (member) {
        // Update existing member
        await MemberService.updateMember(member.id, {
          address: formData.address || undefined,
          emergency_contact_name: formData.emergency_contact_name || undefined,
          emergency_contact_phone: formData.emergency_contact_phone ? cleanPhoneNumber(formData.emergency_contact_phone) : undefined,
          date_of_birth: formData.date_of_birth || undefined,
        });

        // Update user data
        await MemberService.updateMemberUser(member.id, {
          full_name: formData.full_name,
          phone: formData.phone ? cleanPhoneNumber(formData.phone) : undefined,
          email: formData.email,
        });
      } else {
        // Create new member
        await MemberService.createMember(
          {
            email: formData.email,
            full_name: formData.full_name,
            phone: formData.phone ? cleanPhoneNumber(formData.phone) : undefined,
            role: formData.role,
          },
          {
            address: formData.address || undefined,
            emergency_contact_name: formData.emergency_contact_name || undefined,
            emergency_contact_phone: formData.emergency_contact_phone ? cleanPhoneNumber(formData.emergency_contact_phone) : undefined,
            date_of_birth: formData.date_of_birth || undefined,
          }
        );
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save member');
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!member;

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditing ? 'Edit Member' : 'Add New Member'}
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

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
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

        {/* Profile Photo Section */}
        {isEditing && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Profile Photo</h4>
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {profilePhotoUrl ? (
                  <img
                    className="h-20 w-20 rounded-full object-cover"
                    src={profilePhotoUrl}
                    alt="Profile"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center">
                    <svg className="h-10 w-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  {uploadingPhoto ? 'Uploading...' : profilePhotoUrl ? 'Change Photo' : 'Upload Photo'}
                </button>
                {profilePhotoUrl && (
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    disabled={uploadingPhoto}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                  >
                    Delete Photo
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={FILE_CONSTRAINTS.PROFILE_PHOTO.ALLOWED_TYPES.join(',')}
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-500">
              Supported formats: JPEG, PNG, WebP. Maximum size: 5MB.
            </p>
          </div>
        )}

        {/* Personal Information */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Personal Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
                className={`mt-1 block w-full border rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.full_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {validationErrors.full_name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.full_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className={`mt-1 block w-full border rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter 10-digit phone number"
                maxLength={10}
                pattern="[0-9]{10}"
                className={`mt-1 block w-full border rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {validationErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Enter exactly 10 digits (numbers only)</p>
            </div>

            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
                Date of Birth
              </label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {!isEditing && (
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="MEMBER">Member</option>
                  <option value="USER">General User</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Emergency Contact</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-gray-700">
                Contact Name
              </label>
              <input
                type="text"
                id="emergency_contact_name"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-gray-700">
                Contact Phone
              </label>
              <input
                type="tel"
                id="emergency_contact_phone"
                name="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={handleInputChange}
                placeholder="Enter 10-digit phone number"
                maxLength={10}
                pattern="[0-9]{10}"
                className={`mt-1 block w-full border rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.emergency_contact_phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {validationErrors.emergency_contact_phone && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.emergency_contact_phone}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Enter exactly 10 digits (numbers only)</p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {loading ? 'Saving...' : isEditing ? 'Update Member' : 'Create Member'}
          </button>
        </div>
      </form>
    </div>
  );
};