'use client';

import { useTranslations } from 'next-intl';
import { usePricing } from '../../../lib/api';

export default function PricingPage() {
  const t = useTranslations('pricing');
  const { data: pricingData, isLoading, error } = usePricing();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-red-400">{t('error')}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white py-32 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-gray-500 text-sm font-mono tracking-wider mb-8">
            [ {t('sectionTitle')} ]
          </p>
          <h1 className="text-4xl lg:text-5xl font-light text-white mb-8">
            {t('title')}
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            {t('description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingData?.tiers?.map((tier: any, index: number) => (
            <div key={index} className="border border-gray-700 rounded-lg p-8">
              <h3 className="text-xl font-medium text-white mb-4">
                {tier.name}
              </h3>
              <p className="text-3xl font-light text-white mb-6">
                ${tier.price}
                <span className="text-sm text-gray-400">/{tier.period}</span>
              </p>
              <ul className="space-y-3 mb-8">
                {tier.features?.map((feature: string, idx: number) => (
                  <li key={idx} className="text-gray-300 flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full border border-gray-600 text-white py-3 rounded-full hover:border-gray-400 transition-colors">
                {t('selectPlan')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}