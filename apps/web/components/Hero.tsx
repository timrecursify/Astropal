'use client';

import { useTranslations } from 'next-intl';

export default function Hero() {
  const t = useTranslations('hero');

  return (
    <section className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-gray-500 text-sm font-mono tracking-wider mb-8">
          [ {t('mission')} ]
        </p>
        
        <h1 className="text-4xl md:text-6xl lg:text-8xl font-light text-white leading-tight mb-12">
          {t('title')}
        </h1>
        
        <div className="flex items-center justify-center space-x-4 mb-12">
          <div className="w-6 h-6 border border-gray-600 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <p className="text-gray-300 text-lg max-w-2xl">
            {t('description')}
          </p>
        </div>
        
        <button className="border border-gray-600 text-white px-8 py-3 rounded-full hover:border-gray-400 transition-colors">
          {t('cta')}
        </button>
      </div>
    </section>
  );
}