// Validation utilities for form inputs

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Phone number validation - exactly 10 digits
export const validatePhoneNumber = (phone: string): ValidationResult => {
  if (!phone || phone.trim() === '') {
    return { isValid: true }; // Phone is optional
  }

  // Remove any spaces, dashes, or other non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length !== 10) {
    return {
      isValid: false,
      error: 'Phone number must be exactly 10 digits'
    };
  }

  // Check if it's all digits
  if (!/^\d{10}$/.test(cleanPhone)) {
    return {
      isValid: false,
      error: 'Phone number must contain only digits'
    };
  }

  return { isValid: true };
};

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim() === '') {
    return {
      isValid: false,
      error: 'Email is required'
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address'
    };
  }

  return { isValid: true };
};

// Full name validation
export const validateFullName = (name: string): ValidationResult => {
  if (!name || name.trim() === '') {
    return {
      isValid: false,
      error: 'Full name is required'
    };
  }

  if (name.trim().length < 2) {
    return {
      isValid: false,
      error: 'Full name must be at least 2 characters long'
    };
  }

  return { isValid: true };
};

// Format phone number for display (adds spaces for readability)
export const formatPhoneNumber = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    return `${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;
  }
  return phone;
};

// Clean phone number for storage (removes all non-digits)
export const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

// Validate all member form data
export const validateMemberForm = (formData: {
  email: string;
  full_name: string;
  phone?: string;
  emergency_contact_phone?: string;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // Validate email
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error!;
  }

  // Validate full name
  const nameValidation = validateFullName(formData.full_name);
  if (!nameValidation.isValid) {
    errors.full_name = nameValidation.error!;
  }

  // Validate phone number
  if (formData.phone) {
    const phoneValidation = validatePhoneNumber(formData.phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error!;
    }
  }

  // Validate emergency contact phone
  if (formData.emergency_contact_phone) {
    const emergencyPhoneValidation = validatePhoneNumber(formData.emergency_contact_phone);
    if (!emergencyPhoneValidation.isValid) {
      errors.emergency_contact_phone = emergencyPhoneValidation.error!;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};