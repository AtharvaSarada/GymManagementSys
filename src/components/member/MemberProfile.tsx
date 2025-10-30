import React, { useState, useEffect } from 'react';
import { MemberService } from '../../services/memberService';
import type { Member } from '../../types/database';
import { FILE_CONSTRAINTS } from '../../types/database';
import { validateMemberForm, cleanPhoneNumber } from '../../utils/validation';

interface MemberProfileProps {
  member: Member;
  onMemberUpdate: (updatedMember: Member) => void;
}

export const MemberProfile: React.FC<MemberProfileProps> = ({ member, onMemberUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    full_name: member.user?.full_name || '',
    phone: member.user?.phone || '',
    email: member.user?.email || '',
    address: member.address || '',
    emergency_contact_name: member.emergency_contact_name || '',
    emergency_contact_phone: member.emergency_contact_phone || '',
    date_of_birth: member.date_of_birth || '',
  });

  useEffect(() => {
    // Update form data when member prop changes
    setFormData({
      full_name: member.user?.full_name || '',
      phone: member.user?.phone || '',
      email: member.user?.email || '',
      address: member.address || '',
      emergency_contact_name: member.emergency_contact_name || '',
      emergency_contact_phone: member.emergency_contact_phone || '',
      date_of_birth: member.date_of_birth || '',
    });
  }, [member]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
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
      // Update user details
      const userData = {
        full_name: formData.full_name,
        phone: formData.phone ? cleanPhoneNumber(formData.phone) : undefined,
        email: formData.email,
      };

      // Update member details
      const memberData = {
        address: formData.address,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone ? cleanPhoneNumber(formData.emergency_contact_phone) : undefined,
        date_of_birth: formData.date_of_birth,
      };

      // Update user information
      await MemberService.updateMemberUser(member.id, userData);
      
      // Update member information
      const updatedMember = await MemberService.updateMember(member.id, memberData);
      
      onMemberUpdate(updatedMember);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!FILE_CONSTRAINTS.PROFILE_PHOTO.ALLOWED_TYPES.includes(file.type as any)) {
      setError('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    if (file.size > FILE_CONSTRAINTS.PROFILE_PHOTO.MAX_SIZE) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    setError(null);

    try {
      const photoUrl = await MemberService.uploadProfilePhoto(member.id, file);
      
      // Update member state with new photo URL
      const updatedMember = {
        ...member,
        user: {
          ...member.user!,
          profile_photo_url: photoUrl
        }
      };
      
      onMemberUpdate(updatedMember);
      setSuccess('Profile photo updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!member.user?.profile_photo_url) return;

    setUploadingPhoto(true);
    setError(null);

    try {
      await MemberService.deleteProfilePhoto(member.id);
      
      // Update member state to remove photo URL
      const updatedMember = {
        ...member,
        user: {
          ...member.user!,
          profile_photo_url: undefined
        }
      };
      
      onMemberUpdate(updatedMember);
      setSuccess('Profile photo removed successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getDaysUntilExpiry = () => {
    if (!member.membership_end_date) return null;
    const today = new Date();
    const expiryDate = new Date(member.membership_end_date);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = getDaysUntilExpiry();

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="ml-3 text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="ml-3 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Profile Photo Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Photo</h3>
        
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
            {member.user?.profile_photo_url ? (
              <img 
                src={member.user.profile_photo_url} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-semibold text-2xl">
                  {member.user?.full_name?.charAt(0) || 'M'}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer text-sm font-medium transition-colors">
                {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="hidden"
                />
              </label>
              
              {member.user?.profile_photo_url && (
                <button
                  onClick={handleDeletePhoto}
                  disabled={uploadingPhoto}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Remove Photo
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              JPG, PNG or WebP. Max size 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Membership Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Membership Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Membership Number</label>
            <p className="text-sm text-gray-900 font-mono">{member.membership_number}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Status</label>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              member.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
              member.status === 'INACTIVE' ? 'bg-yellow-100 text-yellow-800' :
              member.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {member.status}
            </span>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Package</label>
            <p className="text-sm text-gray-900">{member.fee_package?.name || 'No Package Assigned'}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Join Date</label>
            <p className="text-sm text-gray-900">{new Date(member.join_date).toLocaleDateString()}</p>
          </div>
          
          {member.membership_start_date && (
            <div>
              <label className="text-sm font-medium text-gray-500">Membership Start</label>
              <p className="text-sm text-gray-900">{new Date(member.membership_start_date).toLocaleDateString()}</p>
            </div>
          )}
          
          {member.membership_end_date && (
            <div>
              <label className="text-sm font-medium text-gray-500">Membership Expires</label>
              <div>
                <p className="text-sm text-gray-900">{new Date(member.membership_end_date).toLocaleDateString()}</p>
                {daysUntilExpiry !== null && (
                  <p className={`text-xs ${
                    daysUntilExpiry <= 7 ? 'text-red-600' : 
                    daysUntilExpiry <= 30 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {daysUntilExpiry > 0 ? `${daysUntilExpiry} days remaining` : 'Expired'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
          <button
            onClick={() => {
              setIsEditing(!isEditing);
              setError(null);
              setSuccess(null);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {validationErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Enter exactly 10 digits (numbers only)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
                <input
                  type="tel"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleInputChange}
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.emergency_contact_phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {validationErrors.emergency_contact_phone && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.emergency_contact_phone}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Enter exactly 10 digits (numbers only)</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Full Name</label>
              <p className="text-sm text-gray-900">{member.user?.full_name || 'Not provided'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <p className="text-sm text-gray-900">{member.user?.phone || 'Not provided'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-sm text-gray-900">{member.user?.email || 'Not provided'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Age</label>
              <p className="text-sm text-gray-900">
                {member.date_of_birth ? `${calculateAge(member.date_of_birth)} years` : 'Not provided'}
              </p>
            </div>
            
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500">Address</label>
              <p className="text-sm text-gray-900">{member.address || 'Not provided'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Emergency Contact</label>
              <p className="text-sm text-gray-900">
                {member.emergency_contact_name || 'Not provided'}
                {member.emergency_contact_phone && (
                  <span className="block text-xs text-gray-500">{member.emergency_contact_phone}</span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};