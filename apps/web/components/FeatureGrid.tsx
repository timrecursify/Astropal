'use client';

import { useTranslations } from 'next-intl';

export default function FeatureGrid() {
  const t = useTranslations('features');

  const features = [
    {
      title: t('feature1.title'),
      description: t('feature1.description'),
    },
    {
      title: t('feature2.title'),
      description: t('feature2.description'),
    },
    {
      title: t('feature3.title'),
      description: t('feature3.description'),
    },
  ];

  return (
    <section className="py-32 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <p className="text-gray-500 text-sm font-mono tracking-wider mb-8">
            [ {t('sectionTitle')} ]
          </p>
          <h2 className="text-4xl lg:text-5xl font-light text-white mb-8">
            {t('title')}
          </h2>
          <p className="text-gray-300 text-lg max-w-md">
            {t('description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
          {features.map((feature, index) => (
            <div key={index} className="group">
              <div className="mb-8">
                <div className="w-12 h-12 border border-gray-700 rounded-lg flex items-center justify-center mb-6 group-hover:border-gray-500 transition-colors">
                  <div className="w-6 h-6 bg-white rounded-full"></div>
                </div>
                <h3 className="text-xl font-medium text-white mb-4">
                  {feature.title}
                </h3>
              </div>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}