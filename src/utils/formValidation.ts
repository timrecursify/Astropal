// Enhanced form validation utilities for all variants

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
 * Enhanced email validation that catches common typos
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }

  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  // Common typo patterns to catch
  const commonTypos = [
    /\.comm?$/, // .comm instead of .com
    /\.orgg?$/, // .orgg instead of .org
    /\.nett?$/, // .nett instead of .net
    /\.coom$/, // .coom instead of .com
    /\.gmail\.comm?$/, // .gmail.comm instead of .gmail.com
    /\.yahoo\.comm?$/, // .yahoo.comm instead of .yahoo.com
    /\.hotmail\.comm?$/, // .hotmail.comm instead of .hotmail.com
    /\.outlook\.comm?$/, // .outlook.comm instead of .outlook.com
    /@gmail\.comm?$/, // @gmail.comm
    /@yahoo\.comm?$/, // @yahoo.comm
    /@hotmail\.comm?$/, // @hotmail.comm
  ];

  for (const typoPattern of commonTypos) {
    if (typoPattern.test(email)) {
      return { isValid: false, error: 'Please check your email address - it appears to have a typo' };
    }
  }

  // Check for missing @ or multiple @
  const atCount = (email.match(/@/g) || []).length;
  if (atCount !== 1) {
    return { isValid: false, error: 'Email must contain exactly one @ symbol' };
  }

  // Check for valid characters
  const validEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!validEmailRegex.test(email)) {
    return { isValid: false, error: 'Email contains invalid characters' };
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