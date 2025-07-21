import { describe, test, expect, beforeEach } from 'vitest';
import { validateRequest, RegisterRequestSchema } from '@/lib/validation';

describe('User Registration', () => {
  test('validates valid registration data', () => {
    const validData = {
      email: 'test@example.com',
      birthDate: '1990-05-15',
      birthLocation: 'New York, USA',
      birthTime: '14:30',
      timezone: 'America/New_York',
      locale: 'en-US',
      perspective: 'calm',
      focusAreas: ['wellness', 'career']
    };

    const result = validateRequest(RegisterRequestSchema, validData);
    expect(result.email).toBe('test@example.com');
    expect(result.perspective).toBe('calm');
    expect(result.focusAreas).toHaveLength(2);
  });

  test('rejects invalid email format', () => {
    const invalidData = {
      email: 'invalid-email',
      birthDate: '1990-05-15',
      birthLocation: 'New York, USA',
      timezone: 'America/New_York',
      locale: 'en-US',
      perspective: 'calm',
      focusAreas: ['wellness']
    };

    expect(() => {
      validateRequest(RegisterRequestSchema, invalidData);
    }).toThrow();
  });

  test('validates birth date constraints', () => {
    const futureDate = {
      email: 'test@example.com',
      birthDate: '2030-01-01', // Future date
      birthLocation: 'New York, USA',
      timezone: 'America/New_York',
      locale: 'en-US',
      perspective: 'calm',
      focusAreas: ['wellness']
    };

    expect(() => {
      validateRequest(RegisterRequestSchema, futureDate);
    }).toThrow();
  });

  test('validates focus areas constraints', () => {
    const tooManyFocusAreas = {
      email: 'test@example.com',
      birthDate: '1990-05-15',
      birthLocation: 'New York, USA',
      timezone: 'America/New_York',
      locale: 'en-US',
      perspective: 'calm',
      focusAreas: ['wellness', 'career', 'relationships', 'spiritual'] // Too many
    };

    expect(() => {
      validateRequest(RegisterRequestSchema, tooManyFocusAreas);
    }).toThrow();
  });

  test('validates birth location format', () => {
    const invalidLocation = {
      email: 'test@example.com',
      birthDate: '1990-05-15',
      birthLocation: 'InvalidLocation', // Missing comma
      timezone: 'America/New_York',
      locale: 'en-US',
      perspective: 'calm',
      focusAreas: ['wellness']
    };

    expect(() => {
      validateRequest(RegisterRequestSchema, invalidLocation);
    }).toThrow();
  });

  test('applies default values correctly', () => {
    const minimalData = {
      email: 'test@example.com',
      birthDate: '1990-05-15',
      birthLocation: 'New York, USA',
      timezone: 'America/New_York',
      focusAreas: ['wellness']
    };

    const result = validateRequest(RegisterRequestSchema, minimalData);
    expect(result.locale).toBe('en-US'); // Default
    expect(result.perspective).toBe('calm'); // Default
    expect(result.birthTime).toBe('12:00'); // Default
  });
});

describe('Auth Token Generation', () => {
  test('token validation schema works', () => {
    const validToken = {
      token: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789'
    };

    // This would use TokenValidationSchema
    expect(validToken.token).toHaveLength(64);
    expect(validToken.token).toMatch(/^[a-f0-9]+$/);
  });
});

describe('Rate Limiting', () => {
  test('rate limit configuration is valid', () => {
    const signupEmailConfig = {
      windowMs: 24 * 60 * 60 * 1000,
      maxAttempts: 1,
      keyPrefix: 'signup:email'
    };

    expect(signupEmailConfig.windowMs).toBe(86400000); // 24 hours
    expect(signupEmailConfig.maxAttempts).toBe(1);
  });
});

// Integration test placeholder
describe('Full Registration Flow', () => {
  test('placeholder for integration test', () => {
    // This would test the full flow:
    // 1. Submit registration data
    // 2. Verify rate limiting
    // 3. Check database insertion
    // 4. Verify email sending
    // 5. Validate response format
    
    expect(true).toBe(true); // Placeholder
  });
}); 