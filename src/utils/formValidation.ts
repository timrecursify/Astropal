// Professional form validation using industry-standard validator.js library
import { isEmail } from 'validator';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FormData {
  fullName?: string;
  preferredName: string;
  email: string;
  birthDate: string;
  birthLocation: string;
  timeZone?: string;
  dayStartTime?: string;
  birthTime?: string;
  relationshipStatus?: string;
  practices: string[];
  lifeFocus: string[];
}

/**
 * Professional email validation using validator.js - handles all edge cases and international domains
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }

  // Use validator.js - industry standard with comprehensive validation
  if (!isEmail(email.trim())) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  // Additional length check for practical purposes
  if (email.length > 254) {
    return { isValid: false, error: 'Email address is too long' };
  }

  return { isValid: true };
}

/**
 * Comprehensive form validation for all variants
 */
export function validateForm(formData: FormData): ValidationResult {
  const errors: string[] = [];

  // Email validation
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    errors.push(emailValidation.error!);
  }

  // Required fields
  if (!formData.preferredName?.trim()) {
    errors.push('Preferred name is required');
  }

  if (!formData.birthDate) {
    errors.push('Birth date is required');
  }

  if (!formData.birthLocation?.trim()) {
    errors.push('Birth location is required');
  }

  // Age validation (18+)
  if (formData.birthDate) {
    const birthDate = new Date(formData.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    const actualAge = (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) 
      ? age - 1 
      : age;
      
    if (actualAge < 18) {
      errors.push('You must be at least 18 years old to sign up');
    }
  }

  // Practices validation - at least 1 required
  if (!formData.practices || formData.practices.length === 0) {
    errors.push('Please select at least one cosmic practice');
  }

  // Life focus validation - at least 1 required
  if (!formData.lifeFocus || formData.lifeFocus.length === 0) {
    errors.push('Please select at least one life focus area');
  }

  // Numerology validation
  if (formData.practices.includes('Numerology') && !formData.fullName?.trim()) {
    errors.push('Full name is required when Numerology is selected');
  }

  // Name length validation
  if (formData.preferredName && formData.preferredName.length > 50) {
    errors.push('Preferred name must be 50 characters or less');
  }

  if (formData.fullName && formData.fullName.length > 100) {
    errors.push('Full name must be 100 characters or less');
  }

  // Birth location validation
  if (formData.birthLocation && formData.birthLocation.length < 2) {
    errors.push('Birth location must be at least 2 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Display validation errors to user
 */
export function displayValidationErrors(errors: string[]): void {
  if (errors.length > 0) {
    const errorMessage = 'Please fix the following issues:\n\n' + errors.map(error => `• ${error}`).join('\n');
    alert(errorMessage);
  }
}