'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useReferral } from '../lib/api';

export default function ReferralBanner() {
  const t = useTranslations('referral');
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('r');
  
  const { data: referralData, isLoading } = useReferral(referralCode || '');

  if (!referralCode || isLoading) return null;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-8">
      <div className="flex items-center space-x-4">
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        <div>
          <h3 className="text-white font-medium">
            {t('title')}
          </h3>
          <p className="text-gray-400 text-sm">
            {t('description')}
          </p>
        </div>
      </div>
    </div>
  );
}