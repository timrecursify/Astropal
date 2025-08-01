import { useState } from 'react';

export interface FormData {
  fullName: string;
  preferredName: string;
  email: string;
  birthDate: string;
  birthLocation: string;
  timeZone: string;
  dayStartTime: string;
  birthTime: string;
  relationshipStatus: string;
  practices: {
    astrology: boolean;
    numerology: boolean;
    tarot: boolean;
    crystals: boolean;
    chakra: boolean;
    fengShui: boolean;
  };
  lifeFocus: {
    love: boolean;
    career: boolean;
    health: boolean;
    wealth: boolean;
    growth: boolean;
    family: boolean;
  };
}

export const useFormState = () => {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    preferredName: '',
    email: '',
    birthDate: '',
    birthLocation: '',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dayStartTime: '07:00',
    birthTime: '',
    relationshipStatus: '',
    practices: {
      astrology: false,
      numerology: false,
      tarot: false,
      crystals: false,
      chakra: false,
      fengShui: false,
    },
    lifeFocus: {
      love: false,
      career: false,
      health: false,
      wealth: false,
      growth: false,
      family: false,
    },
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updatePractice = (practice: keyof FormData['practices'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      practices: { ...prev.practices, [practice]: value }
    }));
  };

  const updateLifeFocus = (focus: keyof FormData['lifeFocus'], value: boolean) => {
    const currentCount = Object.values(formData.lifeFocus).filter(Boolean).length;
    
    if (value && currentCount >= 3) {
      return; // Don't allow more than 3 selections
    }

    setFormData(prev => ({
      ...prev,
      lifeFocus: { ...prev.lifeFocus, [focus]: value }
    }));
  };

  return {
    formData,
    updateField,
    updatePractice,
    updateLifeFocus,
  };
};